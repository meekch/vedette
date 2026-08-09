/**
 * How to read this page.
 *
 * The interface encodes four distinct provenance states, and a first-time viewer
 * has no way to decode them from the visuals alone — an amber dot means nothing
 * until someone says what it means. This is the smallest thing that makes the
 * rest of the page self-explanatory, which is why it sits above the fold rather
 * than in a help panel nobody opens.
 *
 * Server component: it is static text.
 */
export function ProvenanceLegend() {
  return (
    <section
      aria-label="How to read this page"
      className="rounded-lg border bg-muted/30 p-4"
    >
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        How to read this page
      </h2>

      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        <Item
          marker={
            <span className="text-xs text-foreground/70 underline decoration-dotted underline-offset-2">
              3 sources
            </span>
          }
          term="Grounded in evidence"
          def="Click any score to read its rationale, then a source chip to see the exact text it came from."
        />
        <Item
          marker={<span className="size-2 rounded-full bg-amber-500" />}
          term="Assumption"
          def="The model inferred this rather than finding it. Never presented as fact, and always editable."
        />
        <Item
          marker={
            <span className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
              26
            </span>
          }
          term="Proposed by the model"
          def="Hours, headcount, rates and durations. The model never states a dollar amount — it has no field for one."
        />
        <Item
          marker={
            <span className="font-mono text-xs font-semibold tabular-nums">$45,543</span>
          }
          term="Computed by code"
          def="Every currency figure comes from a deterministic TypeScript function, recalculated as you edit."
        />
      </dl>
    </section>
  );
}

function Item({
  marker,
  term,
  def,
}: {
  marker: React.ReactNode;
  term: string;
  def: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-2">
        <span className="flex h-5 shrink-0 items-center">{marker}</span>
        <span className="text-sm font-medium">{term}</span>
      </dt>
      <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">{def}</dd>
    </div>
  );
}
