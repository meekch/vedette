import "server-only";
import { generateObject } from "ai";
import { opportunitySetSchema, type OpportunitySet } from "@/lib/ai/schemas/opportunity";
import { DIMENSIONS } from "@/lib/scoring/dimensions";
import { resolveChatModel } from "@/lib/ai/provider";

/**
 * The Analysis & Scoring Agent — one of the three agents in ADR-004.
 *
 * It is handed evidence chunks and returns scored opportunities. It does not
 * retrieve, persist, or compute money; those belong to the ingestion pipeline
 * (Phase 2), the caller, and `src/lib/roi/model.ts` respectively. Keeping the
 * agent to one job is what makes its output testable and its failures legible.
 */

/** A chunk of source text the agent may cite. `id` is what it puts in evidenceIds. */
export interface EvidenceChunk {
  id: string;
  /** Where this came from, e.g. "SOP-Dispatch.pdf, p.3". Shown to the agent and the user. */
  sourceLabel: string;
  content: string;
}

export interface AnalysisContext {
  organizationName: string;
  organizationProfile: string;
  /** Objectives leadership actually stated — the basis for strategicAlignment. */
  statedObjectives: string[];
  chunks: EvidenceChunk[];
}

export interface AnalysisRun {
  result: OpportunitySet;
  /** Recorded to `agent_runs` by the caller (ADR-003 § observability). */
  telemetry: {
    provider: string;
    modelId: string;
    latencyMs: number;
    inputTokens?: number;
    outputTokens?: number;
  };
}

/**
 * The rubric is generated from `DIMENSIONS` rather than restated in prose, so
 * the scale the agent is told about cannot drift from the scale the composite
 * is computed on.
 */
function renderRubric(): string {
  return DIMENSIONS.map(
    (d) =>
      `- ${d.key} (${d.label}, ${d.polarity === "lower_is_better" ? "lower is better" : "higher is better"}): ${d.description}\n` +
      `    1 = ${d.anchors.low}\n   10 = ${d.anchors.high}`,
  ).join("\n");
}

function renderEvidence(chunks: EvidenceChunk[]): string {
  return chunks
    .map((c) => `[${c.id}] (${c.sourceLabel})\n${c.content}`)
    .join("\n\n---\n\n");
}

const SYSTEM_PROMPT = `You are the analysis lead on an AI transformation engagement. You read what a company's own documents and interviews actually say, and you identify where AI would create measurable value.

You are writing for two audiences at once: the consultant who will defend every line of this to a client, and the executive who will fund it. Both will ask "how do you know that?" about any claim you make.

Ground rules:

- Cite evidence for every score and every ROI input. Put the ids of the chunks you used in evidenceIds. If you are inferring rather than citing, set isAssumption to true and leave evidenceIds empty. Both are acceptable; an uncited claim presented as fact is not.
- Never state a dollar figure, a saving, or a payback period. Propose the underlying quantities — hours, headcount, rates, durations — and the application computes the money from them. This is not a formatting preference: the numbers you would produce cannot be audited, and the ones the application produces can.
- Be specific to this company. "Use AI to improve customer service" is not an opportunity. "Draft first-pass responses to the recurring billing questions in the Q2 ticket export" is.
- Score the dimensions you can justify and omit the ones you cannot. An omitted score is honest; a made-up middling score is not.
- Prefer fewer, better opportunities. Do not pad the list.
- Record what you could not determine in coverageGaps. Unanswered questions are a deliverable, not a failure.`;

export async function runAnalysis(context: AnalysisContext): Promise<AnalysisRun> {
  if (context.chunks.length === 0) {
    throw new Error(
      "runAnalysis: no evidence chunks supplied. The agent must not be asked to " +
        "generate opportunities from nothing — that is exactly the failure mode " +
        "the evidence invariant exists to prevent.",
    );
  }

  const { model, provider, modelId } = resolveChatModel();
  const startedAt = Date.now();

  const { object, usage } = await generateObject({
    model,
    schema: opportunitySetSchema,
    // A full analysis is several thousand tokens of JSON, and on models with
    // adaptive thinking the output cap covers reasoning *and* the response. Left
    // at the SDK default, generation truncates mid-object and surfaces as
    // "response did not match schema" — which reads like a schema bug and isn't.
    maxOutputTokens: 32000,
    system: SYSTEM_PROMPT,
    prompt: `# Client

${context.organizationName}

${context.organizationProfile}

# Objectives leadership has stated

${context.statedObjectives.map((o) => `- ${o}`).join("\n")}

# Scoring rubric

${renderRubric()}

# Evidence

Every chunk below is available to cite by its bracketed id.

${renderEvidence(context.chunks)}

# Task

Identify the AI opportunities this evidence actually supports. Score each one against the rubric, propose the ROI inputs, and record what you could not determine.`,
  });

  return {
    result: object,
    telemetry: {
      provider,
      modelId,
      latencyMs: Date.now() - startedAt,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
    },
  };
}
