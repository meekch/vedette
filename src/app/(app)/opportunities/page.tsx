import { PageHeader } from "@/components/nav/page-header";
import { ComingSoon } from "@/components/nav/coming-soon";

export default function OpportunitiesPage() {
  return (
    <>
      <PageHeader
        title="Opportunities"
        description="Scored AI opportunities with evidence and inspectable ROI"
      />
      <ComingSoon phase={4} title="Opportunity Scoring + ROI">
        <p>
          Phase 4 adds the Analysis &amp; Scoring Agent, per-dimension scores with
          visible evidence and labeled assumptions, and a deterministic ROI model
          with editable inputs and a prioritization matrix.
        </p>
      </ComingSoon>
    </>
  );
}
