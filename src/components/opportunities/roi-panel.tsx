"use client";

import { useMemo, useState } from "react";
import { computeRoi, formatCurrency } from "@/lib/roi/model";
import { userOverride } from "@/lib/roi/defaults";
import type { RoiInputs } from "@/lib/roi/types";
import { Badge } from "@/components/ui/badge";
import { EvidenceTrail, type EvidenceMap } from "./evidence";

/**
 * The ROI panel — the screen this whole product is arguing for.
 *
 * Its job is to make one thing visually undeniable: the model proposed the
 * quantities on the left, and **code** produced the money on the right. That is
 * why the two halves are separated by a labelled rule rather than laid out as
 * one continuous form. An executive should be able to see the boundary without
 * being told it exists.
 *
 * Editing any input recomputes instantly — the calculation is a pure function
 * (`computeRoi`), so there is no request, no spinner, and no opportunity for the
 * displayed figure to disagree with the inputs above it.
 */

interface FieldSpec {
  key: keyof RoiInputs;
  label: string;
  /** Rendered as a percentage; stored as a fraction. */
  asPercent?: boolean;
  /** Rendered as currency; still an input, not a computed benefit. */
  asCurrency?: boolean;
  step?: number;
  suffix?: string;
}

const FIELDS: FieldSpec[] = [
  { key: "hoursPerWeek", label: "Hours per person / week", step: 0.5 },
  { key: "peopleAffected", label: "People affected", step: 1 },
  { key: "loadedHourlyCost", label: "Loaded hourly cost", asCurrency: true, step: 1 },
  { key: "automationPotential", label: "Automatable share", asPercent: true, step: 5 },
  { key: "adoptionRate", label: "Steady-state adoption", asPercent: true, step: 5 },
  { key: "rampMonths", label: "Adoption ramp", step: 1, suffix: "months" },
  { key: "implementationCost", label: "Implementation cost", asCurrency: true, step: 1000 },
  { key: "annualRunCost", label: "Annual run cost", asCurrency: true, step: 1000 },
];

export function RoiPanel({
  baseInputs,
  evidence,
}: {
  baseInputs: RoiInputs;
  evidence: EvidenceMap;
}) {
  const [inputs, setInputs] = useState<RoiInputs>(baseInputs);
  const [openField, setOpenField] = useState<keyof RoiInputs | null>(null);

  const result = useMemo(() => computeRoi(inputs), [inputs]);
  const edited = useMemo(
    () => FIELDS.some((f) => inputs[f.key].source === "user_override" && baseInputs[f.key].source !== "user_override"),
    [inputs, baseInputs],
  );

  function update(key: keyof RoiInputs, raw: string, asPercent?: boolean) {
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    setInputs((prev) => ({
      ...prev,
      [key]: userOverride(asPercent ? parsed / 100 : parsed),
    }));
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="grid gap-0 lg:grid-cols-[1fr_auto_1fr]">
        {/* ── Left: what the model proposed ── */}
        <section className="p-4">
          <header className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Inputs — proposed by the model
            </h4>
            {edited && (
              <Badge variant="secondary" className="text-[10px]">
                edited
              </Badge>
            )}
          </header>

          <dl className="space-y-1">
            {FIELDS.map((field) => {
              const input = inputs[field.key];
              const display = field.asPercent
                ? Math.round(input.value * 100)
                : input.value;
              const isOpen = openField === field.key;

              return (
                <div key={field.key} className="rounded-md px-2 py-1.5 hover:bg-muted/40">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex min-w-0 items-center gap-1.5 text-sm">
                      <button
                        type="button"
                        onClick={() => setOpenField(isOpen ? null : field.key)}
                        aria-expanded={isOpen}
                        className="truncate text-left text-foreground/90 underline-offset-2 hover:underline"
                      >
                        {field.label}
                      </button>
                      {input.isAssumption && (
                        <span
                          title="Assumption — not established by evidence"
                          aria-label="Assumption"
                          className="size-1.5 shrink-0 rounded-full bg-amber-500"
                        />
                      )}
                    </dt>
                    <dd className="flex shrink-0 items-center gap-1">
                      {field.asCurrency && (
                        <span className="text-xs text-muted-foreground">$</span>
                      )}
                      <input
                        type="number"
                        value={display}
                        step={field.step}
                        onChange={(e) => update(field.key, e.target.value, field.asPercent)}
                        aria-label={field.label}
                        className="w-24 rounded border bg-background px-1.5 py-0.5 text-right font-mono text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <span className="w-12 text-xs text-muted-foreground">
                        {field.asPercent ? "%" : (field.suffix ?? "")}
                      </span>
                    </dd>
                  </div>

                  {isOpen && (
                    <div className="px-1 pb-1">
                      <p className="mt-1 text-xs text-muted-foreground">{input.basis}</p>
                      <EvidenceTrail
                        evidenceIds={input.evidenceIds}
                        isAssumption={input.isAssumption}
                        evidence={evidence}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </dl>
        </section>

        {/* ── The seam ── */}
        <div
          aria-hidden
          className="relative flex items-center justify-center border-y lg:border-x lg:border-y-0"
        >
          <span className="px-3 py-2 text-center font-mono text-[10px] uppercase leading-tight tracking-wider text-muted-foreground lg:[writing-mode:vertical-rl]">
            computed in TypeScript →
          </span>
        </div>

        {/* ── Right: what the code computed ── */}
        <section className="p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Outputs — computed, never model-authored
          </h4>

          <div className="space-y-3">
            <Figure
              label="Steady-state net savings"
              value={formatCurrency(result.steadyStateNetSavings)}
              hint="per year, after run cost, once adoption settles"
              emphasis
            />
            <div className="grid grid-cols-2 gap-3">
              <Figure
                label="Year one, net"
                value={formatCurrency(result.year1NetSavings)}
                hint="after build + run cost"
                negative={result.year1NetSavings < 0}
              />
              <Figure
                label="Payback"
                value={
                  result.paybackMonths === null
                    ? "Never"
                    : `${result.paybackMonths} mo`
                }
                hint={
                  result.paybackMonths === null
                    ? "does not pay back within 36 months"
                    : "cumulative net turns positive"
                }
                negative={result.paybackMonths === null}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Figure
                label="Hours returned"
                value={`${result.steadyStateAnnualHours.toLocaleString()} h`}
                hint="per year at steady state"
              />
              <Figure
                label="Three-year net"
                value={formatCurrency(result.threeYearNetSavings)}
                hint="36-month cumulative"
                negative={result.threeYearNetSavings < 0}
              />
            </div>
          </div>

          <RampChart schedule={result.monthlySchedule} />

          {result.assumptionKeys.length > 0 && (
            <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
              <span className="mr-1 inline-block size-1.5 rounded-full bg-amber-500 align-middle" />
              {result.assumptionKeys.length} of {FIELDS.length} inputs are assumptions.
              Weakest input:{" "}
              <span className="font-medium text-foreground/80">
                {FIELDS.find((f) => f.key === result.weakestInput.key)?.label}
              </span>{" "}
              at {Math.round(result.weakestInput.confidence * 100)}% confidence.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Figure({
  label,
  value,
  hint,
  emphasis,
  negative,
}: {
  label: string;
  value: string;
  hint: string;
  emphasis?: boolean;
  negative?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`font-mono tabular-nums ${emphasis ? "text-2xl font-semibold" : "text-lg font-medium"} ${
          negative ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

/**
 * Twelve-month cumulative-net sparkline.
 *
 * Inline SVG rather than a chart library: it is a single series with a single
 * meaningful feature (the zero crossing), and Recharts would add a client bundle
 * for something twenty lines of SVG says more clearly.
 */
function RampChart({
  schedule,
}: {
  schedule: { month: number; cumulativeNet: number }[];
}) {
  const values = schedule.map((m) => m.cumulativeNet);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;
  const w = 100;
  const h = 32;

  const x = (i: number) => (i / (values.length - 1)) * w;
  const y = (v: number) => h - ((v - min) / range) * h;
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const zeroY = y(0);

  return (
    <div className="mt-4">
      <div className="mb-1 text-[11px] text-muted-foreground">
        Cumulative net position, months 1–12
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="h-8 w-full"
        role="img"
        aria-label="Cumulative net position over the first twelve months"
      >
        <line
          x1="0"
          x2={w}
          y1={zeroY}
          y2={zeroY}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-border"
          strokeDasharray="2 2"
        />
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          className="text-foreground/70"
        />
      </svg>
    </div>
  );
}
