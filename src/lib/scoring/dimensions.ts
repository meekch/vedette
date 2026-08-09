/**
 * The eight scoring dimensions and how they combine.
 *
 * Per `docs/PHASES.md` Phase 4. Like the ROI model, the composite is computed in
 * TypeScript from per-dimension scores the agent proposes — the agent never
 * emits a ranking or an overall number, because a single opaque score is exactly
 * the thing an executive cannot interrogate.
 */

/** Whether a high raw score is good or bad for this dimension. */
export type Polarity = "higher_is_better" | "lower_is_better";

export interface Dimension {
  key: DimensionKey;
  label: string;
  /** Shown in the UI next to the score, and given to the agent as the rubric. */
  description: string;
  polarity: Polarity;
  /** Relative weight in the composite. Weights are normalised at compute time. */
  weight: number;
  /** What a 1 looks like and what a 10 looks like — anchors the agent's scale. */
  anchors: { low: string; high: string };
}

export const DIMENSIONS = [
  {
    key: "impact",
    label: "Impact",
    description:
      "Size of the operational or financial improvement if this works as intended.",
    polarity: "higher_is_better",
    weight: 3,
    anchors: {
      low: "Saves a few minutes for one person",
      high: "Removes a bottleneck affecting the whole operation",
    },
  },
  {
    key: "effort",
    label: "Effort",
    description:
      "Build and rollout effort in engineering and change-management terms.",
    polarity: "lower_is_better",
    weight: 2,
    anchors: {
      low: "Days of work with existing tools",
      high: "Multi-quarter programme with new systems",
    },
  },
  {
    key: "complexity",
    label: "Technical complexity",
    description:
      "How hard the underlying problem is — integration surface, edge cases, model reliability.",
    polarity: "lower_is_better",
    weight: 1.5,
    anchors: {
      low: "Well-trodden pattern on clean data",
      high: "Novel approach across brittle legacy systems",
    },
  },
  {
    key: "risk",
    label: "Risk",
    description:
      "Consequence of the system being wrong: safety, compliance, customer trust, financial exposure.",
    polarity: "lower_is_better",
    weight: 2,
    anchors: {
      low: "A wrong answer is an inconvenience someone catches",
      high: "A wrong answer creates legal or safety exposure",
    },
  },
  {
    key: "dataAvailability",
    label: "Data availability",
    description:
      "Whether the data this needs already exists, is accessible, and is good enough.",
    polarity: "higher_is_better",
    weight: 2.5,
    anchors: {
      low: "Data does not exist or lives only in people's heads",
      high: "Clean, accessible, already-structured data",
    },
  },
  {
    key: "adoptionLikelihood",
    label: "Adoption likelihood",
    description:
      "Whether the people affected will actually use it, given workflow fit and incentives.",
    polarity: "higher_is_better",
    weight: 2.5,
    anchors: {
      low: "Adds a step to an already-resented process",
      high: "Removes work people actively complain about",
    },
  },
  {
    key: "strategicAlignment",
    label: "Strategic alignment",
    description:
      "Fit with the objectives leadership has actually stated for this engagement.",
    polarity: "higher_is_better",
    weight: 1.5,
    anchors: {
      low: "Unrelated to any stated objective",
      high: "Directly advances a named leadership priority",
    },
  },
  {
    key: "timeToValue",
    label: "Time to value",
    description: "How long until the first measurable benefit lands.",
    polarity: "lower_is_better",
    weight: 2,
    anchors: {
      low: "Value within weeks",
      high: "Value more than a year out",
    },
  },
] as const satisfies readonly Dimension[];

/**
 * The dimension keys as a const tuple.
 *
 * Declared explicitly rather than derived with `.map()` so that `z.enum()` in
 * `src/lib/ai/schemas/opportunity.ts` receives a literal tuple and infers the
 * union — a mapped array widens to `string[]`, which silently erases the key
 * type all the way through to the scoring functions. The `satisfies` check below
 * keeps this list and `DIMENSIONS` from drifting apart.
 */
export const DIMENSION_KEYS = [
  "impact",
  "effort",
  "complexity",
  "risk",
  "dataAvailability",
  "adoptionLikelihood",
  "strategicAlignment",
  "timeToValue",
] as const;

export type DimensionKey = (typeof DIMENSION_KEYS)[number];

// Fails to compile if DIMENSIONS gains, loses, or renames a key.
const _keysMatch = DIMENSIONS.map((d) => d.key) satisfies readonly DimensionKey[];
void _keysMatch;

export function getDimension(key: DimensionKey): Dimension {
  const found = DIMENSIONS.find((d) => d.key === key);
  if (!found) throw new Error(`Unknown scoring dimension: ${key}`);
  return found;
}

/** One dimension's score as proposed by the agent, with its evidence. */
export interface DimensionScore {
  key: DimensionKey;
  /** 1–10 on the dimension's own scale, before polarity is applied. */
  score: number;
  /** Why this score — one or two sentences the FDE can read aloud. */
  rationale: string;
  /** 0–1. The agent's confidence in this score. */
  confidence: number;
  /** True when the score rests on inference rather than cited evidence. */
  isAssumption: boolean;
  /** Chunk ids backing the rationale. Empty iff `isAssumption`. */
  evidenceIds: string[];
}

/**
 * Normalise a raw 1–10 score so that higher always means "more attractive",
 * regardless of the dimension's polarity. An effort of 2 becomes a 9.
 */
export function toAttractiveness(key: DimensionKey, score: number): number {
  const clamped = Math.min(10, Math.max(1, score));
  return getDimension(key).polarity === "lower_is_better" ? 11 - clamped : clamped;
}

/**
 * Weighted composite across all scored dimensions, on a 0–10 scale.
 *
 * Dimensions the agent did not score are excluded from both numerator and
 * denominator rather than defaulted — a missing score is missing information,
 * and silently substituting a 5 would fabricate a middling opinion.
 */
export function compositeScore(scores: DimensionScore[]): number {
  let weighted = 0;
  let totalWeight = 0;
  for (const s of scores) {
    const dim = getDimension(s.key);
    weighted += toAttractiveness(s.key, s.score) * dim.weight;
    totalWeight += dim.weight;
  }
  if (totalWeight === 0) return 0;
  return Math.round((weighted / totalWeight) * 10) / 10;
}

/**
 * Where this opportunity sits on the impact × effort matrix, using the raw
 * (pre-polarity) scores so the axes read the way people expect on a chart.
 */
export function matrixPosition(scores: DimensionScore[]): {
  impact: number;
  effort: number;
} | null {
  const impact = scores.find((s) => s.key === "impact");
  const effort = scores.find((s) => s.key === "effort");
  if (!impact || !effort) return null;
  return { impact: impact.score, effort: effort.score };
}
