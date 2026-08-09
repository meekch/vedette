import { describe, it, expect } from "vitest";
import { NAV_ITEMS } from "@/components/nav/nav-config";

// Smoke test: proves the test runner + path alias work in CI, and pins the
// honest-stub invariant — a surface is either built or labelled with the phase
// that will build it. A nav item claiming to be live when it isn't is the one
// failure mode this file exists to catch.
describe("workspace navigation config", () => {
  it("exposes the five primary surfaces", () => {
    expect(NAV_ITEMS.map((i) => i.label).sort()).toEqual([
      "Dashboard",
      "Deliverables",
      "Discovery",
      "Documents",
      "Opportunities",
    ]);
  });

  it("marks exactly the built surfaces as available", () => {
    const available = NAV_ITEMS.filter((i) => i.comingInPhase === null);
    expect(available.map((i) => i.href)).toEqual(["/dashboard", "/opportunities"]);
  });

  it("gives every unbuilt surface a phase number", () => {
    for (const item of NAV_ITEMS.filter((i) => i.comingInPhase !== null)) {
      expect(item.comingInPhase).toBeGreaterThan(1);
    }
  });
});
