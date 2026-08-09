/**
 * The ROI calculator.
 *
 * This is the only place in the codebase that produces a dollar figure. It is a
 * pure function of its inputs — no I/O, no model call, no randomness — so the
 * same inputs always yield the same number, the UI can recompute on every
 * keystroke, and `tests/roi.test.ts` can pin the arithmetic exactly.
 *
 * See `./types.ts` for why the LLM/TypeScript split is drawn where it is.
 */

import { HORIZON_MONTHS } from "./defaults";
import type { RoiInput, RoiInputs, RoiMonth, RoiResult } from "./types";

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

/** Round to whole currency units at the presentation boundary. */
function toCurrency(n: number): number {
  return Math.round(n);
}

/** Round hours to one decimal — enough precision to be useful, not to mislead. */
function toHours(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Effective adoption in a given month under a linear ramp.
 *
 * Month 1 is the first month of use, so a 4-month ramp reaches full adoption at
 * month 4, not month 5. A ramp of 0 (or less) means adoption is immediate —
 * guarded here rather than in the caller so a bad input can't divide by zero.
 */
export function adoptionAtMonth(
  month: number,
  rampMonths: number,
  steadyStateAdoption: number,
): number {
  if (rampMonths <= 0) return steadyStateAdoption;
  const progress = Math.min(1, month / rampMonths);
  return steadyStateAdoption * progress;
}

/**
 * Compute every derived figure for one opportunity.
 *
 * Costs are treated as: `implementationCost` lands entirely in month 1, and
 * `annualRunCost` accrues evenly across the year. That is a simplification — real
 * builds spread cost over the delivery period — but it is *conservative* (payback
 * is never reported earlier than it would be under a spread), and conservative is
 * the right bias for a number an executive will be held to.
 */
export function computeRoi(inputs: RoiInputs): RoiResult {
  const hoursPerWeek = inputs.hoursPerWeek.value;
  const people = inputs.peopleAffected.value;
  const hourlyCost = inputs.loadedHourlyCost.value;
  const automation = clampFraction(inputs.automationPotential.value);
  const adoption = clampFraction(inputs.adoptionRate.value);
  const rampMonths = Math.max(0, inputs.rampMonths.value);
  const implementationCost = inputs.implementationCost.value;
  const annualRunCost = inputs.annualRunCost.value;

  const baselineAnnualHours = hoursPerWeek * WEEKS_PER_YEAR * people;
  const automatableAnnualHours = baselineAnnualHours * automation;
  const steadyStateAnnualHours = automatableAnnualHours * adoption;

  const steadyStateGrossSavings = steadyStateAnnualHours * hourlyCost;
  const steadyStateNetSavings = steadyStateGrossSavings - annualRunCost;

  // Per-month schedule over the full horizon. Only the first 12 months are
  // returned for charting, but payback and the 3-year figure need all of them.
  const monthlyRunCost = annualRunCost / MONTHS_PER_YEAR;
  const automatableMonthlyHours = automatableAnnualHours / MONTHS_PER_YEAR;

  const schedule: RoiMonth[] = [];
  let cumulativeNet = -implementationCost;
  let paybackMonths: number | null = null;
  let year1GrossSavings = 0;

  for (let month = 1; month <= HORIZON_MONTHS; month++) {
    const effectiveAdoption = adoptionAtMonth(month, rampMonths, adoption);
    const hoursSaved = automatableMonthlyHours * effectiveAdoption;
    const grossSavings = hoursSaved * hourlyCost;

    cumulativeNet += grossSavings - monthlyRunCost;

    if (paybackMonths === null && cumulativeNet >= 0) {
      paybackMonths = month;
    }
    if (month <= MONTHS_PER_YEAR) {
      year1GrossSavings += grossSavings;
      schedule.push({
        month,
        effectiveAdoption,
        hoursSaved: toHours(hoursSaved),
        grossSavings: toCurrency(grossSavings),
        cumulativeNet: toCurrency(cumulativeNet),
      });
    }
  }

  const year1NetSavings = year1GrossSavings - implementationCost - annualRunCost;

  return {
    baselineAnnualHours: toHours(baselineAnnualHours),
    automatableAnnualHours: toHours(automatableAnnualHours),
    steadyStateAnnualHours: toHours(steadyStateAnnualHours),

    steadyStateGrossSavings: toCurrency(steadyStateGrossSavings),
    steadyStateNetSavings: toCurrency(steadyStateNetSavings),

    year1GrossSavings: toCurrency(year1GrossSavings),
    year1NetSavings: toCurrency(year1NetSavings),

    paybackMonths,
    threeYearNetSavings: toCurrency(cumulativeNet),

    monthlySchedule: schedule,

    weakestInput: weakestInput(inputs),
    assumptionKeys: assumptionKeys(inputs),
  };
}

/** Clamp a rate into [0, 1]. A model that proposes 1.4 gets 1.0, not nonsense. */
function clampFraction(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

const INPUT_KEYS: (keyof RoiInputs)[] = [
  "hoursPerWeek",
  "peopleAffected",
  "loadedHourlyCost",
  "automationPotential",
  "adoptionRate",
  "rampMonths",
  "implementationCost",
  "annualRunCost",
];

/**
 * The least-confident input. Reported rather than averaged: a business case is
 * only as sound as its shakiest number, and averaging hides exactly that.
 * Ties resolve to the first key in `INPUT_KEYS` order, so the result is stable.
 */
function weakestInput(inputs: RoiInputs): { key: keyof RoiInputs; confidence: number } {
  let key: keyof RoiInputs = INPUT_KEYS[0];
  let confidence = Number.POSITIVE_INFINITY;
  for (const k of INPUT_KEYS) {
    const c = (inputs[k] as RoiInput).confidence;
    if (c < confidence) {
      confidence = c;
      key = k;
    }
  }
  return { key, confidence };
}

function assumptionKeys(inputs: RoiInputs): (keyof RoiInputs)[] {
  return INPUT_KEYS.filter((k) => (inputs[k] as RoiInput).isAssumption);
}

/** Format a computed figure for display. Never called on model output. */
export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
