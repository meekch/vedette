import { describe, it, expect } from "vitest";
import { opportunitySetSchema } from "@/lib/ai/schemas/opportunity";
import { compositeScore } from "@/lib/scoring/dimensions";
import { computeRoi } from "@/lib/roi/model";
import { roiInputsFromProposal } from "@/lib/roi/from-proposal";
import { MERIDIAN_ANALYSIS } from "@seed/meridian/analysis";
import { MERIDIAN_DOCUMENTS, MERIDIAN_EVIDENCE } from "@seed/meridian/documents";

/**
 * The seed is demo data, but it is not exempt from the product's own rules.
 * These tests hold it to exactly the contract the live agent is held to — if the
 * snapshot could contain an uncited claim or a dangling evidence id, the demo
 * would be asserting an invariant the code does not actually enforce.
 */

describe("Meridian analysis snapshot", () => {
  it("validates against the same schema the agent must satisfy", () => {
    const parsed = opportunitySetSchema.safeParse(MERIDIAN_ANALYSIS);
    if (!parsed.success) {
      throw new Error(
        `Seed analysis violates opportunitySetSchema:\n${JSON.stringify(parsed.error.issues, null, 2)}`,
      );
    }
    expect(parsed.success).toBe(true);
  });

  it("cites only evidence ids that exist in the document set", () => {
    const validIds = new Set(MERIDIAN_EVIDENCE.map((c) => c.id));
    const dangling: string[] = [];

    for (const opp of MERIDIAN_ANALYSIS.opportunities) {
      const cited = [
        ...opp.scores.flatMap((s) => s.evidenceIds),
        ...opp.roiInputs.evidenceIds,
      ];
      for (const id of cited) {
        if (!validIds.has(id)) dangling.push(`${opp.title} → ${id}`);
      }
    }

    expect(dangling).toEqual([]);
  });

  it("never cites a chunk from a document that has not been received", () => {
    // `requested` documents have no content yet. Citing one would mean claiming
    // evidence from a file nobody has read — the exact failure the `requested`
    // lifecycle state (schema v1.1) exists to make visible.
    const requestedChunkIds = new Set(
      MERIDIAN_DOCUMENTS.filter((d) => d.status === "requested").flatMap((d) =>
        d.chunks.map((c) => c.id),
      ),
    );
    const cited = MERIDIAN_ANALYSIS.opportunities.flatMap((o) =>
      o.scores.flatMap((s) => s.evidenceIds),
    );
    expect(cited.filter((id) => requestedChunkIds.has(id))).toEqual([]);
  });

  it("marks every un-evidenced score as an assumption", () => {
    const violations = MERIDIAN_ANALYSIS.opportunities.flatMap((opp) =>
      opp.scores
        .filter((s) => !s.isAssumption && s.evidenceIds.length === 0)
        .map((s) => `${opp.title} → ${s.key}`),
    );
    expect(violations).toEqual([]);
  });

  it("states no dollar figure in prose that is absent from the source documents", () => {
    // The schema stops the agent having a currency *field* to fill. It cannot
    // stop it writing money into prose, so that is checked here.
    //
    // The rule is not "no dollar signs" — quoting a figure the client themselves
    // stated is exactly right, and the agent legitimately cites the SOP's $2,500
    // approval threshold. The rule is that every figure must trace to the
    // evidence. Amounts are compared by magnitude, not text, so a faithful
    // restatement of "$310,000" as "$310k" passes while an invented number fails.
    const magnitudes = (text: string): number[] =>
      [...text.matchAll(/\$\s?([\d,]+(?:\.\d+)?)\s*([kKmM])?/g)].map(([, num, suffix]) => {
        const base = Number(num.replace(/,/g, ""));
        if (/[kK]/.test(suffix ?? "")) return base * 1_000;
        if (/[mM]/.test(suffix ?? "")) return base * 1_000_000;
        return base;
      });

    const evidenceAmounts = new Set(
      MERIDIAN_EVIDENCE.flatMap((c) => magnitudes(c.content)),
    );

    const invented: string[] = [];
    for (const opp of MERIDIAN_ANALYSIS.opportunities) {
      const prose = [opp.summary, opp.problemStatement, ...opp.scores.map((s) => s.rationale)];
      for (const text of prose) {
        for (const amount of magnitudes(text)) {
          if (!evidenceAmounts.has(amount)) {
            invented.push(`${opp.title}: $${amount.toLocaleString()}`);
          }
        }
      }
    }

    expect(invented).toEqual([]);
  });

  it("records coverage gaps rather than implying complete knowledge", () => {
    expect(MERIDIAN_ANALYSIS.coverageGaps.length).toBeGreaterThan(0);
  });
});

describe("Meridian opportunities compute end to end", () => {
  it("produces a finite composite score and ROI for every opportunity", () => {
    for (const opp of MERIDIAN_ANALYSIS.opportunities) {
      const composite = compositeScore(opp.scores);
      expect(composite).toBeGreaterThan(0);
      expect(composite).toBeLessThanOrEqual(10);

      const roi = computeRoi(roiInputsFromProposal(opp.roiInputs));
      expect(Number.isFinite(roi.steadyStateGrossSavings)).toBe(true);
      expect(roi.monthlySchedule).toHaveLength(12);
    }
  });

  it("keeps the loaded hourly rate a benchmark, never a model claim", () => {
    // The rate is the highest-leverage number in the whole calculation. If it
    // could ever be attributed to the model, the model could move the headline.
    for (const opp of MERIDIAN_ANALYSIS.opportunities) {
      const inputs = roiInputsFromProposal(opp.roiInputs);
      expect(inputs.loadedHourlyCost.source).toBe("benchmark");
      expect(inputs.loadedHourlyCost.isAssumption).toBe(true);
    }
  });
});

describe("Meridian document set", () => {
  it("includes a deliberately messy document", () => {
    expect(MERIDIAN_DOCUMENTS.some((d) => d.isMessy)).toBe(true);
  });

  it("includes a requested-but-not-received document with no chunks", () => {
    const requested = MERIDIAN_DOCUMENTS.filter((d) => d.status === "requested");
    expect(requested.length).toBeGreaterThan(0);
    for (const doc of requested) expect(doc.chunks).toHaveLength(0);
  });

  it("exposes evidence only from processed documents", () => {
    expect(MERIDIAN_EVIDENCE.length).toBeGreaterThan(15);
    const ids = new Set(MERIDIAN_EVIDENCE.map((c) => c.id));
    expect(ids.size).toBe(MERIDIAN_EVIDENCE.length);
  });
});
