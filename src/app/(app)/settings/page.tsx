import { PageHeader } from "@/components/nav/page-header";
import { ComingSoon } from "@/components/nav/coming-soon";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Organization and member management"
      />
      <ComingSoon phase={1} title="Organization settings">
        <p>
          Organization and member management is handled through Clerk once auth is
          wired. Deeper settings surfaces arrive alongside later phases.
        </p>
      </ComingSoon>
    </>
  );
}
