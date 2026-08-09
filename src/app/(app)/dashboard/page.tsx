import Link from "next/link";
import { PageHeader } from "@/components/nav/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { compositeScore } from "@/lib/scoring/dimensions";
import { computeRoi, formatCurrency } from "@/lib/roi/model";
import { roiInputsFromProposal } from "@/lib/roi/from-proposal";
import { MERIDIAN_ANALYSIS } from "@seed/meridian/analysis";
import { MERIDIAN_DOCUMENTS } from "@seed/meridian/documents";
import { MERIDIAN_ORG, MERIDIAN_OBJECTIVES } from "@seed/meridian/profile";

/**
 * Engagement dashboard.
 *
 * Every figure here is derived from the seed and recomputed on render — none of
 * it is hardcoded copy. That matters more than it looks: a dashboard of static
 * strings is the standard way a demo lies about being wired up.
 */
export default function DashboardPage() {
  const scored = MERIDIAN_ANALYSIS.opportunities.map((o) => ({
    title: o.title,
    composite: compositeScore(o.scores),
    roi: computeRoi(roiInputsFromProposal(o.roiInputs)),
  }));

  const totalSteadyState = scored.reduce((s, o) => s + o.roi.steadyStateNetSavings, 0);
  const top = [...scored].sort((a, b) => b.composite - a.composite)[0];

  const processed = MERIDIAN_DOCUMENTS.filter((d) => d.status === "processed");
  const requested = MERIDIAN_DOCUMENTS.filter((d) => d.status === "requested");
  const chunkCount = processed.reduce((s, d) => s + d.chunks.length, 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${MERIDIAN_ORG.name} — AI transformation engagement`}
      />

      <div className="space-y-4 p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{MERIDIAN_ORG.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {MERIDIAN_ORG.headcount}-person facilities services company
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Identified opportunity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {formatCurrency(totalSteadyState)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                steady-state net, per year, across{" "}
                {MERIDIAN_ANALYSIS.opportunities.length} scored opportunities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Knowledge base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {chunkCount} chunks
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                from {processed.length} documents
                {requested.length > 0 && ` · ${requested.length} requested, not received`}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Highest-scoring opportunity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xl font-semibold tabular-nums">
                  {top.composite.toFixed(1)}
                </span>
                <span className="text-lg font-medium">{top.title}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatCurrency(top.roi.steadyStateNetSavings)} steady-state net per
                year
                {top.roi.paybackMonths !== null &&
                  ` · payback in ${top.roi.paybackMonths} months`}
                . Every score traces to source text; every figure is computed from
                editable inputs.
              </p>
              <Link
                href="/opportunities"
                className={`mt-4 ${buttonVariants({ size: "sm" })}`}
              >
                Open the backlog
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {MERIDIAN_ANALYSIS.coverageGaps.length}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                gaps the analysis could not close from current evidence — the next
                round of discovery.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Objectives leadership stated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {MERIDIAN_OBJECTIVES.map((o) => (
                <li key={o} className="flex gap-2 text-sm">
                  <span
                    aria-hidden
                    className="mt-2 size-1 shrink-0 rounded-full bg-foreground/40"
                  />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Strategic-alignment scores are graded against these, not against a
              generic notion of business value.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Next</Badge>
              <CardTitle className="text-sm font-medium">
                Phase 2 — Knowledge Engine
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Document upload, parsing, and pgvector retrieval replace the seeded
            chunks that currently feed the scoring agent. The evidence contract does
            not change — only where the chunks come from.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
