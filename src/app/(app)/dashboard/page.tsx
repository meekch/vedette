import { PageHeader } from "@/components/nav/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Dashboard is the one workspace surface live from Phase 1. Until the knowledge
// engine (Phase 2) and scoring (Phase 4) populate real metrics, it orients the
// user around the seeded engagement and the build roadmap.
export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Meridian Field Services — AI transformation engagement"
      />
      <div className="grid gap-4 p-8 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">Meridian Field Services</p>
            <p className="mt-1 text-sm text-muted-foreground">
              ~400-person mid-market facilities company
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge>Phase 1</Badge>
              <span className="text-sm text-muted-foreground">
                Foundation + demo company
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Next up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Knowledge Engine (Phase 2): ingest documents, extract entities with
              clickable evidence.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
