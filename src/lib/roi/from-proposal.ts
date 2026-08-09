import type { RoiInputProposal } from "@/lib/ai/schemas/opportunity";
import { loadedCostFor } from "./defaults";
import type { RoiInput, RoiInputs } from "./types";

/**
 * Convert an agent's ROI proposal into the labelled inputs `computeRoi` takes.
 *
 * This is the seam where model output becomes application state, and it is where
 * the loaded hourly *rate* is introduced. The agent proposes a role **band**; the
 * rate is looked up from `./defaults.ts`. That indirection is the point — if the
 * agent could name a rate, it could move the headline savings by naming a bigger
 * one, and no reviewer would notice a plausible-looking hourly figure.
 *
 * The proposal carries one confidence and one assumption flag for the whole ROI
 * block, so that provenance is stamped onto each derived input. When a human
 * edits a field the UI replaces just that input via `userOverride`, which is why
 * provenance lives per-input rather than per-opportunity.
 */
export function roiInputsFromProposal(proposal: RoiInputProposal): RoiInputs {
  const provenance = {
    source: "model_proposed" as const,
    isAssumption: proposal.isAssumption,
    confidence: proposal.confidence,
    evidenceIds: proposal.evidenceIds,
  };

  const proposed = (value: number, basis: string): RoiInput => ({
    value,
    basis,
    ...provenance,
  });

  return {
    hoursPerWeek: proposed(
      proposal.hoursPerWeek,
      "Hours per person per week, proposed from the cited evidence",
    ),
    peopleAffected: proposed(
      proposal.peopleAffected,
      "Headcount doing this work, proposed from the cited evidence",
    ),
    // Not `proposed(...)`: the rate is a benchmark the application chose, not
    // something the agent said. Mislabelling it would put a number the model
    // never saw behind the model's confidence score.
    loadedHourlyCost: loadedCostFor(proposal.loadedCostBand),
    automationPotential: proposed(
      proposal.automationPotential,
      "Share of those hours the intervention removes",
    ),
    adoptionRate: proposed(
      proposal.adoptionRate,
      "Steady-state adoption among affected staff",
    ),
    rampMonths: proposed(
      proposal.rampMonths,
      "Months from launch to steady-state adoption",
    ),
    implementationCost: proposed(
      proposal.implementationCost,
      "One-time build and rollout cost",
    ),
    annualRunCost: proposed(proposal.annualRunCost, "Recurring annual operating cost"),
  };
}
