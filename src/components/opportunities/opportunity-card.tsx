"use client";

import { useState } from "react";
import type { OpportunityProposal } from "@/lib/ai/schemas/opportunity";
import {
  compositeScore,
  getDimension,
  toAttractiveness,
  DIMENSION_KEYS,
  type DimensionKey,
} from "@/lib/scoring/dimensions";
import { roiInputsFromProposal } from "@/lib/roi/from-proposal";
import { Badge } from "@/components/ui/badge";
import { EvidenceTrail, type EvidenceMap } from "./evidence";
import { RoiPanel } from "./roi-panel";

/**
 * One scored opportunity.
 *
 * The dimension list is the part a consultant defends line by line, so each row
 * exposes its own rationale and its own evidence rather than rolling up into a
 * single justification. The composite is shown, but it is deliberately the least
 * prominent number on the card — a single score is what a client argues with,
 * and the per-dimension breakdown is what settles the argument.
 */
export function OpportunityCard({
  opportunity,
  rank,
  evidence,
}: {
  opportunity: OpportunityProposal;
  rank: number;
  evidence: EvidenceMap;
}) {
  const [openDimension, setOpenDimension] = useState<DimensionKey | null>(null);
  const [showRoi, setShowRoi] = useState(rank === 1);

  const composite = compositeScore(opportunity.scores);
  const roiInputs = roiInputsFromProposal(opportunity.roiInputs);
  const assumptionCount = opportunity.scores.filter((s) => s.isAssumption).length;
  const scoredKeys = new Set<DimensionKey>(opportunity.scores.map((s) => s.key));
  const unscored = DIMENSION_KEYS.filter((k) => !scoredKeys.has(k));

  return (
    <article className="rounded-lg border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b p-5">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {String(rank).padStart(2, "0")}
            </span>
            <Badge variant="secondary">{opportunity.processArea}</Badge>
          </div>
          <h3 className="text-lg font-semibold tracking-tight">{opportunity.title}</h3>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {opportunity.summary}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-mono text-3xl font-semibold tabular-nums">
            {composite.toFixed(1)}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            weighted score
          </div>
        </div>
      </header>

      <div className="border-b p-5">
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Current state
        </h4>
        <p className="max-w-3xl text-sm leading-relaxed">{opportunity.problemStatement}</p>
      </div>

      <div className="border-b p-5">
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Scoring
          </h4>
          <span className="text-xs text-muted-foreground">
            {opportunity.scores.length} scored
            {assumptionCount > 0 && ` · ${assumptionCount} assumption${assumptionCount === 1 ? "" : "s"}`}
            {unscored.length > 0 && ` · ${unscored.length} not scorable from current evidence`}
          </span>
        </div>

        <div className="space-y-0.5">
          {opportunity.scores.map((s) => {
            const dim = getDimension(s.key as DimensionKey);
            const attractiveness = toAttractiveness(s.key as DimensionKey, s.score);
            const isOpen = openDimension === s.key;

            return (
              <div key={s.key} className="rounded-md">
                <button
                  type="button"
                  onClick={() => setOpenDimension(isOpen ? null : (s.key as DimensionKey))}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-muted/50"
                >
                  {/* Widths step up at sm: the fixed columns total ~428px, which
                      overflows a 375px viewport if they don't shrink. */}
                  <span className="flex w-28 shrink-0 items-center gap-1.5 text-xs sm:w-44 sm:text-sm">
                    {dim.label}
                    {s.isAssumption && (
                      <span
                        title="Assumption"
                        className="size-1.5 rounded-full bg-amber-500"
                      />
                    )}
                  </span>

                  {/* Bar length is attractiveness, so longer always reads as
                      better; the printed number stays the raw dimension score so
                      it matches what the agent actually said. */}
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-foreground/60"
                      style={{ width: `${attractiveness * 10}%` }}
                    />
                  </span>

                  <span className="w-16 shrink-0 text-right font-mono text-sm tabular-nums">
                    {s.score}
                    <span className="text-muted-foreground">/10</span>
                  </span>
                  <span
                    className="hidden w-10 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums sm:inline"
                    title="Model confidence in this score"
                  >
                    {Math.round(s.confidence * 100)}%
                  </span>

                  {/* The provenance of a score has to be visible before you click
                      it. Without this, a reviewer has no way to know the evidence
                      trail exists — the feature the whole product is arguing for
                      was one undiscoverable click away. */}
                  <span className="flex w-24 shrink-0 items-center justify-end gap-1 text-xs sm:w-28">
                    {s.isAssumption ? (
                      <span className="text-amber-600 dark:text-amber-500">assumption</span>
                    ) : (
                      <span className="text-foreground/70 underline decoration-dotted underline-offset-2">
                        {s.evidenceIds.length} source
                        {s.evidenceIds.length === 1 ? "" : "s"}
                      </span>
                    )}
                    <span
                      aria-hidden
                      className={`text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                    >
                      ›
                    </span>
                  </span>
                </button>

                {isOpen && (
                  <div className="px-2 pb-3 sm:pl-[12.5rem]">
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {s.rationale}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {dim.polarity === "lower_is_better" ? "Lower is better" : "Higher is better"} ·
                      weight {dim.weight}
                    </p>
                    <EvidenceTrail
                      evidenceIds={s.evidenceIds}
                      isAssumption={s.isAssumption}
                      evidence={evidence}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {unscored.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Not scored:{" "}
            {unscored.map((k) => getDimension(k).label).join(", ")} — the supplied
            evidence does not support a defensible score. Omitted rather than guessed.
          </p>
        )}
      </div>

      <div className="p-5">
        <button
          type="button"
          onClick={() => setShowRoi(!showRoi)}
          aria-expanded={showRoi}
          className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          {showRoi ? "▾" : "▸"} ROI model
        </button>
        {showRoi && <RoiPanel baseInputs={roiInputs} evidence={evidence} />}
      </div>
    </article>
  );
}
