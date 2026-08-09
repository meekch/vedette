import "server-only";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/**
 * Chat-model resolution.
 *
 * ADR-003 claims provider swapping is "a config change, not a rewrite". This
 * file is that claim made good: it is the only place in the codebase that names
 * a provider, so every agent takes whatever model this returns. Swapping
 * providers is an environment variable.
 *
 * ADR-005 separately pins **embeddings** to OpenAI `text-embedding-3-small`.
 * That is a different decision with a different rationale (the vector dimension
 * is baked into the schema), and it is untouched by anything here. Today's slice
 * reads seeded chunks directly and needs no embeddings at all — retrieval
 * arrives with the Knowledge Engine in Phase 2.
 */

export type ChatProvider = "anthropic" | "openai";

/**
 * Default Anthropic model. Anthropic's current flagship; 1M context, which
 * matters because the scoring agent is handed a whole engagement's chunks at
 * once rather than a retrieved subset.
 */
const DEFAULT_ANTHROPIC_MODEL = "claude-opus-5";

export interface ResolvedModel {
  model: LanguageModel;
  provider: ChatProvider;
  modelId: string;
}

/**
 * Pick a provider from the environment.
 *
 * Explicit `VEDETTE_CHAT_PROVIDER` wins. Otherwise we auto-detect from whichever
 * API key is present, preferring Anthropic. Auto-detection exists so a fresh
 * clone works with one key set and no extra configuration — the demo path in the
 * README depends on that.
 */
export function resolveProvider(): ChatProvider {
  const explicit = process.env.VEDETTE_CHAT_PROVIDER?.trim().toLowerCase();
  if (explicit === "anthropic" || explicit === "openai") return explicit;

  if (process.env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";

  throw new Error(
    "No chat model configured. Set ANTHROPIC_API_KEY (recommended) or OPENAI_API_KEY " +
      "in .env.local. See README.md § Environment.",
  );
}

/**
 * Resolve the chat model for agent calls.
 *
 * The OpenAI branch deliberately requires an explicit `VEDETTE_CHAT_MODEL` rather
 * than carrying a hardcoded default. A stale model id fails at request time with
 * an opaque 404; making the id explicit turns that into a clear startup error,
 * and keeps this file from silently rotting as provider catalogues change.
 */
export function resolveChatModel(): ResolvedModel {
  const provider = resolveProvider();
  const override = process.env.VEDETTE_CHAT_MODEL?.trim();

  if (provider === "anthropic") {
    const modelId = override || DEFAULT_ANTHROPIC_MODEL;
    return { model: anthropic(modelId), provider, modelId };
  }

  if (!override) {
    throw new Error(
      "VEDETTE_CHAT_PROVIDER=openai requires VEDETTE_CHAT_MODEL to name the model id " +
        "(there is no pinned default for OpenAI — see src/lib/ai/provider.ts).",
    );
  }
  return { model: openai(override), provider, modelId: override };
}
