/**
 * Load the Meridian demo engagement into Supabase.
 *
 *   npm run seed
 *
 * Idempotent: it deletes the demo organisation and everything cascading from it,
 * then reinserts. That is scoped to `clerk_org_id = 'org_demo_meridian'` and
 * touches no other tenant — but it is still a delete, so it prints what it is
 * about to remove and requires --force when the org already holds data.
 *
 * Connects with DATABASE_URL (the postgres role) rather than the service-role
 * PostgREST client. A seed is bulk relational work — foreign keys resolved in
 * dependency order, everything in one transaction — which is what SQL is for.
 * `src/db/service.ts` remains the path for application-side background jobs.
 */

import { config } from "dotenv";
import { Client } from "pg";
import { MERIDIAN_ORG, MERIDIAN_OBJECTIVES, MERIDIAN_STAKEHOLDERS } from "../seed/meridian/profile";
import { MERIDIAN_DOCUMENTS } from "../seed/meridian/documents";
import { MERIDIAN_ANALYSIS } from "../seed/meridian/analysis";
import { compositeScore, type DimensionKey } from "../src/lib/scoring/dimensions";
import { computeRoi } from "../src/lib/roi/model";
import { roiInputsFromProposal } from "../src/lib/roi/from-proposal";

config({ path: ".env.local" });

const DEMO_CLERK_ORG_ID = "org_demo_meridian";

/**
 * The application's dimension keys and the database's `score_dimension` enum
 * were named independently. Mapping them here, exhaustively, keeps both free to
 * use their own idiom while making a mismatch a compile error rather than a
 * runtime enum violation on insert.
 *
 * The enum also carries `roi_potential` and `executive_priority`, which this
 * agent does not score. They are left unpopulated rather than approximated.
 */
const DIMENSION_TO_DB: Record<DimensionKey, string> = {
  impact: "business_impact",
  effort: "implementation_effort",
  complexity: "technical_complexity",
  risk: "risk",
  dataAvailability: "data_availability",
  adoptionLikelihood: "adoption_likelihood",
  strategicAlignment: "strategic_alignment",
  timeToValue: "time_to_value",
};

const force = process.argv.includes("--force");

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not set. See README § Environment.");
  }

  const db = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
  });
  await db.connect();

  try {
    // ── Guard: report what a re-run would destroy before destroying it ────────
    const existing = await db.query<{ id: string; engagements: string; documents: string }>(
      `select o.id,
              (select count(*) from public.engagements e where e.organization_id = o.id) as engagements,
              (select count(*) from public.documents d where d.organization_id = o.id)   as documents
         from public.organizations o
        where o.clerk_org_id = $1`,
      [DEMO_CLERK_ORG_ID],
    );

    if (existing.rowCount) {
      const row = existing.rows[0];
      const populated = Number(row.engagements) > 0 || Number(row.documents) > 0;
      console.log(
        `Demo org already present (${row.engagements} engagement(s), ${row.documents} document(s)).`,
      );
      if (populated && !force) {
        console.log(
          "\nRe-seeding deletes it and everything cascading from it.\n" +
            "Re-run with --force if that is what you want:\n\n  npm run seed -- --force\n",
        );
        return;
      }
    }

    await db.query("begin");

    // Scoped to the demo tenant only; every child table cascades from here.
    const deleted = await db.query(
      "delete from public.organizations where clerk_org_id = $1",
      [DEMO_CLERK_ORG_ID],
    );
    if (deleted.rowCount) console.log(`Removed previous demo org (cascade).`);

    // ── Organisation + engagement ────────────────────────────────────────────
    const org = await db.query<{ id: string }>(
      `insert into public.organizations (clerk_org_id, name, slug, industry, size_band)
       values ($1, $2, $3, $4, $5) returning id`,
      [
        DEMO_CLERK_ORG_ID,
        MERIDIAN_ORG.name,
        MERIDIAN_ORG.slug,
        "Commercial facilities maintenance",
        MERIDIAN_ORG.sizeBand,
      ],
    );
    const orgId = org.rows[0].id;

    const engagement = await db.query<{ id: string }>(
      `insert into public.engagements
         (organization_id, name, client_name, client_industry, client_size_band, status)
       values ($1, $2, $3, $4, $5, 'analysis') returning id`,
      [
        orgId,
        "AI Transformation Assessment 2026",
        MERIDIAN_ORG.name,
        "Commercial facilities maintenance",
        MERIDIAN_ORG.sizeBand,
      ],
    );
    const engagementId = engagement.rows[0].id;
    console.log(`Organisation + engagement created.`);

    // ── Stakeholders ─────────────────────────────────────────────────────────
    for (const s of MERIDIAN_STAKEHOLDERS) {
      await db.query(
        `insert into public.stakeholders
           (organization_id, engagement_id, name, title, department, role_type, influence, notes, source)
         values ($1,$2,$3,$4,$5,$6,$7,$8,'human')`,
        [orgId, engagementId, s.name, s.title, s.department, s.roleType, s.influence, s.notes],
      );
    }
    console.log(`${MERIDIAN_STAKEHOLDERS.length} stakeholders.`);

    // ── Documents + chunks ───────────────────────────────────────────────────
    // chunkIdMap threads the seed's string ids (which the agent cites) through to
    // the database uuids that evidence_links needs.
    const chunkIdMap = new Map<string, string>();
    let chunkCount = 0;

    for (const doc of MERIDIAN_DOCUMENTS) {
      const isRequested = doc.status === "requested";
      const inserted = await db.query<{ id: string }>(
        `insert into public.documents
           (organization_id, engagement_id, file_name, doc_type, title, status,
            extraction_status, request_note, requested_by, storage_path)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
        [
          orgId,
          engagementId,
          // A requested document has no file yet — v1.1 made storage_path and
          // file_name nullable precisely so this row can exist.
          isRequested ? null : doc.fileName,
          doc.docType,
          doc.fileName,
          doc.status,
          doc.docType === "whiteboard_photo" ? "extracted" : "not_applicable",
          isRequested ? doc.provenance : null,
          isRequested ? "human" : null,
          isRequested ? null : `${orgId}/${engagementId}/${doc.id}/${doc.fileName}`,
        ],
      );
      const documentId = inserted.rows[0].id;

      for (const chunk of doc.chunks) {
        const row = await db.query<{ id: string }>(
          `insert into public.chunks
             (organization_id, engagement_id, document_id, chunk_index, content, metadata)
           values ($1,$2,$3,$4,$5,$6) returning id`,
          [
            orgId,
            engagementId,
            documentId,
            chunk.index,
            chunk.content,
            // embedding stays null: vectors arrive with the ingestion pipeline in
            // Phase 2 (ADR-005). Seeding a fake vector would make retrieval look
            // implemented when it is not.
            JSON.stringify({ seed_chunk_id: chunk.id, source_file: doc.fileName }),
          ],
        );
        chunkIdMap.set(chunk.id, row.rows[0].id);
        chunkCount++;
      }
    }
    console.log(`${MERIDIAN_DOCUMENTS.length} documents, ${chunkCount} chunks.`);

    // ── Opportunities, scores, ROI, evidence ─────────────────────────────────
    let scoreCount = 0;
    let evidenceCount = 0;
    const missingCitations: string[] = [];

    for (const opp of MERIDIAN_ANALYSIS.opportunities) {
      const inserted = await db.query<{ id: string }>(
        `insert into public.opportunities
           (organization_id, engagement_id, title, description, category, status, created_by)
         values ($1,$2,$3,$4,$5,'scored','agent') returning id`,
        [
          orgId,
          engagementId,
          opp.title,
          `${opp.summary}\n\nCurrent state: ${opp.problemStatement}`,
          opp.processArea,
        ],
      );
      const opportunityId = inserted.rows[0].id;

      // Scores, each with its own evidence links.
      for (const score of opp.scores) {
        const dimension = DIMENSION_TO_DB[score.key as DimensionKey];
        const scoreRow = await db.query<{ id: string }>(
          `insert into public.scores
             (organization_id, engagement_id, opportunity_id, dimension, value,
              rationale, is_assumption, confidence, computed_by)
           values ($1,$2,$3,$4,$5,$6,$7,$8,'agent') returning id`,
          [
            orgId,
            engagementId,
            opportunityId,
            dimension,
            score.score,
            score.rationale,
            score.isAssumption,
            score.confidence,
          ],
        );
        scoreCount++;
        evidenceCount += await linkEvidence(
          db,
          orgId,
          engagementId,
          "score",
          scoreRow.rows[0].id,
          score.evidenceIds,
          chunkIdMap,
          missingCitations,
        );
      }

      // ROI model. Inputs and computed outputs are stored together so the row is
      // self-checking: annual_savings_usd can be recomputed from its own columns.
      const roiInputs = roiInputsFromProposal(opp.roiInputs);
      const roi = computeRoi(roiInputs);
      const roiRow = await db.query<{ id: string }>(
        `insert into public.roi_models
           (organization_id, engagement_id, opportunity_id,
            hours_per_occurrence, occurrences_per_week, people_affected,
            loaded_hourly_cost_usd, adoption_pct, ramp_months, automation_potential,
            implementation_cost_usd, annual_run_cost_usd,
            inputs_are_assumptions, annual_hours_saved, annual_savings_usd,
            payback_months, computed_at, created_by)
         values ($1,$2,$3,$4,1,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now(),'agent')
         returning id`,
        [
          orgId,
          engagementId,
          opportunityId,
          // occurrences_per_week is fixed at 1 above, so hours_per_occurrence
          // carries the weekly hours directly. The product is what matters.
          roiInputs.hoursPerWeek.value,
          roiInputs.peopleAffected.value,
          roiInputs.loadedHourlyCost.value,
          roiInputs.adoptionRate.value,
          roiInputs.rampMonths.value,
          roiInputs.automationPotential.value,
          roiInputs.implementationCost.value,
          roiInputs.annualRunCost.value,
          opp.roiInputs.isAssumption,
          roi.steadyStateAnnualHours,
          roi.steadyStateNetSavings,
          roi.paybackMonths,
        ],
      );
      evidenceCount += await linkEvidence(
        db,
        orgId,
        engagementId,
        "roi_model",
        roiRow.rows[0].id,
        opp.roiInputs.evidenceIds,
        chunkIdMap,
        missingCitations,
      );
    }

    if (missingCitations.length) {
      throw new Error(
        `Agent cited ${missingCitations.length} chunk id(s) with no row: ${[...new Set(missingCitations)].join(", ")}`,
      );
    }

    await db.query("commit");

    const ranked = MERIDIAN_ANALYSIS.opportunities
      .map((o) => compositeScore(o.scores))
      .sort((a, b) => b - a);

    console.log(
      `${MERIDIAN_ANALYSIS.opportunities.length} opportunities, ${scoreCount} scores, ${evidenceCount} evidence links.`,
    );
    console.log(`\nLoaded. Top composite score ${ranked[0].toFixed(1)}.`);
    console.log(
      `Objectives on record: ${MERIDIAN_OBJECTIVES.length}. Coverage gaps: ${MERIDIAN_ANALYSIS.coverageGaps.length}.`,
    );
  } catch (err) {
    await db.query("rollback").catch(() => {});
    throw err;
  } finally {
    await db.end();
  }
}

/** Insert one evidence_link per cited chunk. Returns how many were written. */
async function linkEvidence(
  db: Client,
  orgId: string,
  engagementId: string,
  subjectType: "score" | "roi_model" | "opportunity",
  subjectId: string,
  seedChunkIds: readonly string[],
  chunkIdMap: Map<string, string>,
  missing: string[],
): Promise<number> {
  let written = 0;
  for (const seedId of seedChunkIds) {
    const chunkId = chunkIdMap.get(seedId);
    if (!chunkId) {
      // Collected rather than thrown here so one run reports every bad citation
      // at once instead of failing on the first.
      missing.push(seedId);
      continue;
    }
    await db.query(
      `insert into public.evidence_links
         (organization_id, engagement_id, subject_type, subject_id, source_type, source_id, created_by)
       values ($1,$2,$3,$4,'chunk',$5,'agent')`,
      [orgId, engagementId, subjectType, subjectId, chunkId],
    );
    written++;
  }
  return written;
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
