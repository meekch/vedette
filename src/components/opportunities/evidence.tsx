"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

/** A chunk flattened for the client — enough to render a citation, no more. */
export interface EvidenceRef {
  id: string;
  sourceLabel: string;
  content: string;
  isMessy: boolean;
}

export type EvidenceMap = Record<string, EvidenceRef>;

/**
 * The citation control.
 *
 * Every claim in this product either renders one of these or renders an
 * assumption badge. There is deliberately no third state — a bare claim with no
 * provenance marker cannot be produced by these components, which is what makes
 * "evidence or it doesn't render" a property of the UI rather than a promise.
 */
export function EvidenceTrail({
  evidenceIds,
  isAssumption,
  evidence,
}: {
  evidenceIds: string[];
  isAssumption: boolean;
  evidence: EvidenceMap;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (isAssumption) {
    return (
      <div className="mt-2">
        <Badge
          variant="outline"
          className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        >
          Assumption — not established by evidence
        </Badge>
      </div>
    );
  }

  const refs = evidenceIds.map((id) => evidence[id]).filter(Boolean);
  const open = openId ? evidence[openId] : null;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Evidence:</span>
        {refs.map((ref) => (
          <button
            key={ref.id}
            type="button"
            onClick={() => setOpenId(openId === ref.id ? null : ref.id)}
            aria-expanded={openId === ref.id}
            className={`rounded border px-1.5 py-0.5 font-mono text-[11px] transition-colors ${
              openId === ref.id
                ? "border-foreground/30 bg-foreground/10 text-foreground"
                : "border-border bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {ref.sourceLabel}
          </button>
        ))}
      </div>

      {open && (
        <figure className="mt-2 rounded-md border-l-2 border-foreground/30 bg-muted/40 px-3 py-2">
          <blockquote className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">
            {open.content}
          </blockquote>
          <figcaption className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-mono">{open.sourceLabel}</span>
            {open.isMessy && (
              <Badge variant="secondary" className="text-[10px]">
                unstructured source
              </Badge>
            )}
          </figcaption>
        </figure>
      )}
    </div>
  );
}
