/**
 * ROI default constants.
 *
 * Resolves the first open question left by `docs/architecture.md` §9
 * ("ROI default constants — loaded-cost bands, adoption-ramp shape").
 *
 * These are **benchmarks, not findings**. Anything sourced from here is created
 * with `source: "benchmark"` and `isAssumption: true`, so the UI always shows it
 * as an assumption a human can overwrite. They exist so an opportunity can be
 * scored before the engagement has established every number, not to stand in
 * for discovery.
 */

import type { RoiInput } from "./types";

/**
 * Fully-loaded hourly cost by role band, in USD.
 *
 * "Fully loaded" = base salary + payroll tax + benefits + overhead allocation,
 * divided by ~2,080 working hours. The multiplier on base salary is ~1.3–1.4 for
 * mid-market US services firms, which is what these bands assume.
 *
 * Bands are deliberately coarse. A precise-looking number here would be false
 * precision — the point is a defensible starting figure the FDE replaces with
 * the client's actual loaded-cost model during discovery.
 */
export const LOADED_HOURLY_COST_BANDS = {
  /** Dispatchers, coordinators, AP/AR clerks, schedulers. */
  frontline_admin: 38,
  /** Field technicians, service crew. */
  field_technician: 52,
  /** Team leads, senior coordinators, supervisors. */
  supervisor: 68,
  /** Analysts, engineers, specialists. */
  professional: 85,
  /** Directors and above. */
  leadership: 130,
} as const;

export type LoadedCostBand = keyof typeof LOADED_HOURLY_COST_BANDS;

/**
 * Default adoption ramp, in months from launch to steady-state adoption.
 *
 * The ramp is **linear** — see `computeRoi`. An S-curve is more faithful to how
 * adoption actually behaves, but it needs two more shape parameters that nobody
 * on an engagement can defend, and it moves year-one savings by only a few
 * percent against a linear ramp of the same length. Linear is the honest choice:
 * one parameter, and the FDE can explain it in a sentence to an executive.
 */
export const ADOPTION_RAMP_MONTHS = {
  /** Drop-in tooling, no process change: a new search box, a summarizer. */
  low_friction: 2,
  /** Changes a step inside an existing workflow. The common case. */
  moderate: 4,
  /** Requires retraining, or replaces a system people are used to. */
  high_friction: 9,
} as const;

export type RampProfile = keyof typeof ADOPTION_RAMP_MONTHS;

/**
 * Default steady-state adoption by ramp profile. [0, 1]
 *
 * Deliberately below 1.0 even for low-friction work: assuming every affected
 * person adopts every time is the single most common way an AI business case
 * overstates itself, and it is the assumption executives probe first.
 */
export const STEADY_STATE_ADOPTION: Record<RampProfile, number> = {
  low_friction: 0.85,
  moderate: 0.7,
  high_friction: 0.5,
};

/** Horizon for the long-run figures. Three years is the usual board framing. */
export const HORIZON_MONTHS = 36;

/** Build a benchmark-sourced input. Always an assumption, always confidence 1. */
export function benchmark(value: number, basis: string): RoiInput {
  return {
    value,
    source: "benchmark",
    isAssumption: true,
    // Confidence 1 means "we are certain this is the benchmark we intended to
    // apply" — not "we are certain it is true for this client". The
    // `isAssumption` flag carries the epistemic warning; conflating the two
    // would make benchmarks look like low-confidence findings, which they aren't.
    confidence: 1,
    basis,
    evidenceIds: [],
  };
}

/** Build a user-supplied input. Never an assumption — a human asserted it. */
export function userOverride(value: number): RoiInput {
  return {
    value,
    source: "user_override",
    isAssumption: false,
    confidence: 1,
    basis: "Set by user",
    evidenceIds: [],
  };
}

/** Loaded hourly cost for a role band, as a labelled benchmark input. */
export function loadedCostFor(band: LoadedCostBand): RoiInput {
  return benchmark(
    LOADED_HOURLY_COST_BANDS[band],
    `Benchmark loaded hourly cost for ${band.replace(/_/g, " ")} (US mid-market, ~1.35x base)`,
  );
}

/** Ramp length and steady-state adoption for a friction profile. */
export function rampFor(profile: RampProfile): {
  rampMonths: RoiInput;
  adoptionRate: RoiInput;
} {
  return {
    rampMonths: benchmark(
      ADOPTION_RAMP_MONTHS[profile],
      `Linear adoption ramp for ${profile.replace(/_/g, " ")} change`,
    ),
    adoptionRate: benchmark(
      STEADY_STATE_ADOPTION[profile],
      `Steady-state adoption for ${profile.replace(/_/g, " ")} change`,
    ),
  };
}
