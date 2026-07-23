import { describe, it, expect } from "vitest";
import { NAV_ITEMS } from "@/components/nav/nav-config";

// Smoke test: proves the test runner + path alias work in CI. Replaced/extended
// by the RLS zero-leak test (Phase 1, step 5) and scoring/ROI math tests (Phase 4).
describe("workspace navigation config", () => {
  it("exposes the five primary surfaces", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Dashboard",
      "Documents",
      "Discovery",
      "Opportunities",
      "Deliverables",
    ]);
  });

  it("only the dashboard is available now; the rest are phased", () => {
    const available = NAV_ITEMS.filter((i) => i.comingInPhase === null);
    expect(available.map((i) => i.href)).toEqual(["/dashboard"]);
  });
});
