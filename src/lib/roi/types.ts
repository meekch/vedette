/**
 * ROI input/output types.
 *
 * The invariant this file exists to enforce (CLAUDE.md, ADR-003):
 * **LLMs propose inputs; TypeScript computes dollars.** Every field an agent is
 * allowed to emit lives in `RoiInputs` and is a count, a rate, or a duration —
 * never a currency amount. Every dollar figure lives in `RoiResult` and is
 * produced only by `computeRoi()` in `./model.ts`.
 *
 * The one apparent exception — `implementationCost` / `annualRunCost` — is a
 * cost the *engagement* supplies, not a saving the model claims. It is still
 * carried as a labelled input so the UI can show it as editable and, when the
 * model proposes a starting figure, mark it an assumption.
 */

/** Where a single input value came from. Drives how the UI renders it. */
export type InputSource =
  /** An agent proposed it from evidence. Always shown with its evidence trail. */
  | "model_proposed"
  /** A human typed it. Outranks everything; never re-proposed over. */
  | "user_override"
  /** A published or engagement-level default (see `./defaults.ts`). */
  | "benchmark";

/**
 * One ROI input, carried with its provenance.
 *
 * `isAssumption` is deliberately separate from `source`: a model-proposed value
 * grounded in a quoted SOP is a *finding*, while the same field guessed from
 * industry norms is an *assumption*. The UI renders those two differently, so
 * the distinction cannot be collapsed into `source`.
 */
export interface RoiInput {
  value: number;
  source: InputSource;
  /** True when this is an estimate rather than something evidence establishes. */
  isAssumption: boolean;
  /** 0–1. Model-reported confidence. Benchmarks and overrides are 1. */
  confidence: number;
  /** Human-readable justification: a quote, a benchmark name, or "set by user". */
  basis: string;
  /** Evidence chunk / answer ids backing this value. Empty for assumptions. */
  evidenceIds: string[];
}

/**
 * The complete set of levers behind one opportunity's ROI.
 *
 * Rates (`automationPotential`, `adoptionRate`) are fractions in [0, 1], not
 * percentages — the UI multiplies by 100 for display. Storing them as fractions
 * keeps the arithmetic in `computeRoi` free of /100 noise.
 */
export interface RoiInputs {
  /** Hours one affected person spends on this work per week. */
  hoursPerWeek: RoiInput;
  /** How many people do this work. */
  peopleAffected: RoiInput;
  /** Fully-loaded hourly cost per person (salary + benefits + overhead). */
  loadedHourlyCost: RoiInput;
  /** Fraction of those hours the intervention can remove. [0, 1] */
  automationPotential: RoiInput;
  /** Fraction of affected people who actually adopt it at steady state. [0, 1] */
  adoptionRate: RoiInput;
  /** Months to reach steady-state adoption from launch. */
  rampMonths: RoiInput;
  /** One-time build/rollout cost. */
  implementationCost: RoiInput;
  /** Recurring annual cost to run it (licences, infra, maintenance). */
  annualRunCost: RoiInput;
}

/** Per-month view of the first year, used for the ramp chart. */
export interface RoiMonth {
  /** 1-indexed month since launch. */
  month: number;
  /** Effective adoption this month, after ramp. [0, 1] */
  effectiveAdoption: number;
  /** Hours saved this month. */
  hoursSaved: number;
  /** Gross savings this month, before costs. */
  grossSavings: number;
  /** Cumulative net position: savings to date minus implementation and run cost. */
  cumulativeNet: number;
}

/**
 * Everything `computeRoi` derives. All currency fields are rounded to whole
 * units at the boundary; the arithmetic that produced them runs unrounded.
 */
export interface RoiResult {
  /** Total hours across all affected people, per year, before any intervention. */
  baselineAnnualHours: number;
  /** Hours the intervention could remove at 100% adoption. */
  automatableAnnualHours: number;
  /** Hours actually removed once adoption settles. */
  steadyStateAnnualHours: number;

  /** Gross annual savings once adoption settles — no costs subtracted. */
  steadyStateGrossSavings: number;
  /** Steady-state gross savings minus the annual run cost. */
  steadyStateNetSavings: number;

  /** Year-one gross savings, reduced by the adoption ramp. */
  year1GrossSavings: number;
  /** Year one after implementation *and* run cost. Often negative — that's the point. */
  year1NetSavings: number;

  /**
   * Months until cumulative net turns positive, or `null` if it never does
   * within the 36-month horizon. Null is a real answer, not a missing value.
   */
  paybackMonths: number | null;

  /** Net position at 36 months. */
  threeYearNetSavings: number;

  /** First 12 months, for the ramp chart. */
  monthlySchedule: RoiMonth[];

  /**
   * Lowest confidence across all inputs, and which input carried it. Surfaces
   * the weakest link rather than averaging it away.
   */
  weakestInput: { key: keyof RoiInputs; confidence: number };
  /** Keys of every input currently flagged as an assumption. */
  assumptionKeys: (keyof RoiInputs)[];
}
