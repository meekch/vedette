import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Clean placeholder for surfaces that a later phase delivers. Honest about
// what's coming and when, rather than faking an empty feature.
export function ComingSoon({
  phase,
  title,
  children,
}: {
  phase: number;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="p-8">
      <Card className="max-w-2xl border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Phase {phase}</Badge>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {children ?? (
            <p>This surface is scheduled for Phase {phase}. See docs/PHASES.md.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
