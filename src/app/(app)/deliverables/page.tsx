import { PageHeader } from "@/components/nav/page-header";
import { ComingSoon } from "@/components/nav/coming-soon";

export default function DeliverablesPage() {
  return (
    <>
      <PageHeader
        title="Deliverables"
        description="Executive-ready briefs generated from the knowledge base"
      />
      <ComingSoon phase={5} title="Executive Deliverables">
        <p>
          Phase 5 adds the Executive Synthesis Agent with a critic pass: the
          Executive AI Transformation Brief, an executive dashboard, and PDF
          export. Every claim cites evidence; assumptions are flagged inline.
        </p>
      </ComingSoon>
    </>
  );
}
