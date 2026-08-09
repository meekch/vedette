/**
 * Zod schemas for the Analysis & Scoring Agent's structured output (ADR-003).
 *
 * This file is where the product's central invariant becomes mechanically
 * enforced rather than merely asserted:
 *
 *   1. **No currency fields exist anywhere in this schema.** The agent has no
 *      way to emit a dollar figure, because there is no field to put one in.
 *      Money is computed by `src/lib/roi/model.ts` from the counts and rates
 *      below. `generateObject` validation makes a violation a retry, not a bug.
 *
 *   2. **Every claim carries evidence or is marked an assumption.** The refinement
 *      on `evidenceBacked` rejects any score or input that cites no evidence
 *      while also claiming not to be an assumption. Un-evidenced confidence is
 *      the failure mode this product exists to prevent, so it fails validation
 *      rather than reaching the UI.
 */

import { z } from "zod";
import { DIMENSION_KEYS } from "@/lib/scoring/dimensions";

const dimensionKey = z.enum(DIMENSION_KEYS);

/**
 * Shared shape for anything the agent asserts: it must either cite evidence or
 * admit to being an assumption. Applied via `.superRefine` so the error message
 * names the offending field rather than failing anonymously.
 */
const evidenceBacked = {
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Your confidence in this value, 0-1."),
  isAssumption: z
    .boolean()
    .describe(
      "True if this rests on inference or general knowledge rather than evidence from the supplied documents.",
    ),
  evidenceIds: z
    .array(z.string())
    .describe(
      "Ids of the supplied chunks that support this. Must be non-empty unless isAssumption is true.",
    ),
};

function requireEvidenceOrAssumption(
  val: { isAssumption: boolean; evidenceIds: string[] },
  ctx: z.RefinementCtx,
) {
  if (!val.isAssumption && val.evidenceIds.length === 0) {
    ctx.addIssue({
      code: "custom",
      message:
        "A non-assumption must cite at least one evidence id. Either cite the chunk you used, or set isAssumption to true.",
      path: ["evidenceIds"],
    });
  }
}

export const dimensionScoreSchema = z
  .object({
    key: dimensionKey,
    score: z
      .number()
      .int()
      .min(1)
      .max(10)
      .describe("1-10 on this dimension's own scale. Do not invert for polarity."),
    rationale: z
      .string()
      .min(1)
      .max(400)
      .describe("One or two sentences a consultant could read aloud to a client."),
    ...evidenceBacked,
  })
  .superRefine(requireEvidenceOrAssumption);

/**
 * The ROI levers the agent is allowed to propose.
 *
 * Note what is absent: savings, cost avoided, revenue, payback, any figure with
 * a currency. `implementationCost` and `annualRunCost` are the only monetary
 * fields, and they are *costs the engagement will incur* — an input to the
 * calculation, never a benefit claimed from it.
 */
export const roiInputProposalSchema = z
  .object({
    hoursPerWeek: z
      .number()
      .min(0)
      .max(80)
      .describe("Hours one affected person spends on this work per week."),
    peopleAffected: z
      .number()
      .int()
      .min(1)
      .describe("How many people do this work."),
    automationPotential: z
      .number()
      .min(0)
      .max(1)
      .describe("Fraction of those hours the intervention removes, 0-1."),
    adoptionRate: z
      .number()
      .min(0)
      .max(1)
      .describe("Fraction of affected people who adopt it at steady state, 0-1."),
    rampMonths: z
      .number()
      .int()
      .min(0)
      .max(24)
      .describe("Months from launch to steady-state adoption."),
    loadedCostBand: z
      .enum([
        "frontline_admin",
        "field_technician",
        "supervisor",
        "professional",
        "leadership",
      ])
      .describe(
        "Role band of the affected people. The application maps this to a loaded hourly cost — do not estimate a rate yourself.",
      ),
    implementationCost: z
      .number()
      .min(0)
      .describe("One-time build and rollout cost the client will incur."),
    annualRunCost: z
      .number()
      .min(0)
      .describe("Recurring annual cost to operate this."),
    ...evidenceBacked,
  })
  .superRefine(requireEvidenceOrAssumption);

export const opportunitySchema = z.object({
  title: z
    .string()
    .min(1)
    .max(120)
    .describe("Short, concrete, and specific to this client. Not a generic AI use case."),
  summary: z
    .string()
    .min(1)
    .max(600)
    .describe("What the intervention is and what changes operationally."),
  /** The pain this addresses, in the client's own words where possible. */
  problemStatement: z
    .string()
    .min(1)
    .max(600)
    .describe("The current-state problem, grounded in what the documents actually say."),
  processArea: z
    .string()
    .min(1)
    .max(80)
    .describe("The business area or process this sits in, e.g. 'Dispatch'."),
  scores: z
    .array(dimensionScoreSchema)
    .min(1)
    .describe("One entry per dimension you can justify. Omit dimensions you cannot score."),
  roiInputs: roiInputProposalSchema,
});

export const opportunitySetSchema = z.object({
  opportunities: z
    .array(opportunitySchema)
    .min(1)
    .max(12)
    .describe("Distinct opportunities. Do not pad the list to reach a count."),
  /**
   * What the agent looked for and could not find. This is as valuable to an FDE
   * as the opportunities themselves — it drives the next round of discovery.
   */
  coverageGaps: z
    .array(z.string().max(300))
    .describe(
      "Questions you could not answer from the supplied evidence, which a human should chase.",
    ),
});

export type DimensionScoreProposal = z.infer<typeof dimensionScoreSchema>;
export type RoiInputProposal = z.infer<typeof roiInputProposalSchema>;
export type OpportunityProposal = z.infer<typeof opportunitySchema>;
export type OpportunitySet = z.infer<typeof opportunitySetSchema>;
