import { PageHeader } from "@/components/nav/page-header";
import { ComingSoon } from "@/components/nav/coming-soon";

export default function DiscoveryPage() {
  return (
    <>
      <PageHeader
        title="Discovery"
        description="Adaptive interviews and the FDE interview tracker"
      />
      <ComingSoon phase={3} title="Discovery Workspace + Interview Tracker">
        <p>
          Phase 3 adds the Discovery Agent&rsquo;s adaptive interview, a coverage
          map across discovery areas, and per-stakeholder sessions. Answers become
          evidence objects.
        </p>
      </ComingSoon>
    </>
  );
}
