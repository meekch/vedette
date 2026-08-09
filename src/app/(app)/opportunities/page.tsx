import { PageHeader } from "@/components/nav/page-header";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import type { EvidenceMap } from "@/components/opportunities/evidence";
import { compositeScore } from "@/lib/scoring/dimensions";
import { computeRoi, formatCurrency } from "@/lib/roi/model";
import { roiInputsFromProposal } from "@/lib/roi/from-proposal";
import { MERIDIAN_ANALYSIS } from "@seed/meridian/analysis";
import { MERIDIAN_DOCUMENTS } from "@seed/meridian/documents";
import { MERIDIAN_ORG } from "@seed/meridian/profile";

/**
 * The opportunity backlog — the first fully-implemented surface.
 *
 * A server component: the evidence map, the ranking, and the portfolio totals
 * are all computed here and shipped as data. Only the interactive parts (evidence
 * expansion, ROI editing) are client components, per the server-first convention
 * in CLAUDE.md.
 */

/** Flatten the document set into the citation lookup the client components take. */
function buildEvidenceMap(): EvidenceMap {
  const map: EvidenceMap = {};
  for (const doc of MERIDIAN_DOCUMENTS) {
    for (const chunk of doc.chunks) {
      map[chunk.id] = {
        id: chunk.id,
        sourceLabel: `${doc.fileName} · ${chunk.index}`,
        content: chunk.content,
        isMessy: doc.isMessy ?? false,
      };
    }
  }
  return map;
}

export default function OpportunitiesPage() {
  const evidence = buildEvidenceMap();

  const ranked = [...MERIDIAN_ANALYSIS.opportunities]
    .map((opportunity) => ({
      opportunity,
      composite: compositeScore(opportunity.scores),
      roi: computeRoi(roiInputsFromProposal(opportunity.roiInputs)),
    }))
    .sort((a, b) => b.composite - a.composite);

  // Portfolio totals are a sum of computed figures, never of model output.
  const totalSteadyState = ranked.reduce(
    (sum, r) => sum + r.roi.steadyStateNetSavings,
    0,
  );
  const totalYearOne = ranked.reduce((sum, r) => sum + r.roi.year1NetSavings, 0);
  const totalHours = ranked.reduce((sum, r) => sum + r.roi.steadyStateAnnualHours, 0);
  const citedChunks = new Set(
    MERIDIAN_ANALYSIS.opportunities.flatMap((o) =>
      o.scores.flatMap((s) => s.evidenceIds),
    ),
  ).size;

  return (
    <>
      <PageHeader
        title="Opportunities"
        description={`${MERIDIAN_ORG.name} — scored against evidence, with inspectable ROI`}
      />

      <div className="space-y-6 p-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Steady-state net"
            value={formatCurrency(totalSteadyState)}
            hint="per year across the portfolio, after run costs"
          />
          <Stat
            label="Year one, net"
            value={formatCurrency(totalYearOne)}
            hint="after implementation — negative is expected"
            negative={totalYearOne < 0}
          />
          <Stat
            label="Hours returned"
            value={`${Math.round(totalHours).toLocaleString()} h`}
            hint="per year at steady-state adoption"
          />
          <Stat
            label="Evidence cited"
            value={`${citedChunks} chunks`}
            hint={`across ${MERIDIAN_ANALYSIS.opportunities.length} opportunities`}
          />
        </section>

        <p className="max-w-3xl text-sm text-muted-foreground">
          Every score below opens to its rationale and the source text behind it.
          Every ROI figure is computed from the editable inputs beside it — the
          model proposes hours, headcount, and rates; it never states a dollar
          amount. Change an assumption and the numbers move immediately.
        </p>

        <div className="space-y-6">
          {ranked.map(({ opportunity }, i) => (
            <OpportunityCard
              key={opportunity.title}
              opportunity={opportunity}
              rank={i + 1}
              evidence={evidence}
            />
          ))}
        </div>

        <section className="rounded-lg border border-dashed bg-muted/30 p-5">
          <h3 className="text-sm font-semibold">What this analysis could not determine</h3>
          <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
            Recorded gaps are a deliverable, not a failure — they are the next
            round of discovery. An analysis that reports no gaps is not more
            complete; it is less honest.
          </p>
          <ul className="mt-3 space-y-2">
            {MERIDIAN_ANALYSIS.coverageGaps.map((gap) => (
              <li key={gap} className="flex gap-2 text-sm text-foreground/90">
                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-amber-500" />
                <span className="max-w-3xl">{gap}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
  negative,
}: {
  label: string;
  value: string;
  hint: string;
  negative?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
          negative ? "text-destructive" : ""
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}
