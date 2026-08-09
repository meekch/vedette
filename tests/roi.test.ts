import { describe, it, expect } from "vitest";
import { computeRoi, adoptionAtMonth } from "@/lib/roi/model";
import { benchmark, userOverride } from "@/lib/roi/defaults";
import type { RoiInputs } from "@/lib/roi/types";

/**
 * These tests pin the ROI arithmetic exactly.
 *
 * They matter beyond regression safety: the claim this product makes to an
 * executive is "the model proposed the inputs, but code computed the number, and
 * here is the test that proves the code is right." A hand-waved calculator would
 * make the whole evidence story rhetorical.
 */

/** A deliberately round set of inputs so expected values are checkable by hand. */
function inputs(overrides: Partial<RoiInputs> = {}): RoiInputs {
  return {
    hoursPerWeek: userOverride(10),
    peopleAffected: userOverride(4),
    loadedHourlyCost: userOverride(50),
    automationPotential: userOverride(0.5),
    adoptionRate: userOverride(1),
    rampMonths: userOverride(0),
    implementationCost: userOverride(0),
    annualRunCost: userOverride(0),
    ...overrides,
  };
}

describe("adoptionAtMonth", () => {
  it("reaches full adoption on the last month of the ramp, not after it", () => {
    expect(adoptionAtMonth(4, 4, 0.8)).toBeCloseTo(0.8);
    expect(adoptionAtMonth(2, 4, 0.8)).toBeCloseTo(0.4);
  });

  it("treats a zero ramp as immediate adoption rather than dividing by zero", () => {
    expect(adoptionAtMonth(1, 0, 0.7)).toBeCloseTo(0.7);
  });

  it("never exceeds steady state after the ramp completes", () => {
    expect(adoptionAtMonth(24, 4, 0.8)).toBeCloseTo(0.8);
  });
});

describe("computeRoi — baseline arithmetic", () => {
  it("derives annual hours from weekly hours and headcount", () => {
    const r = computeRoi(inputs());
    // 10 h/wk * 52 wks * 4 people = 2080 h
    expect(r.baselineAnnualHours).toBe(2080);
    // 50% automatable
    expect(r.automatableAnnualHours).toBe(1040);
    // 100% adoption
    expect(r.steadyStateAnnualHours).toBe(1040);
    // 1040 h * $50
    expect(r.steadyStateGrossSavings).toBe(52_000);
  });

  it("subtracts the annual run cost from steady-state savings", () => {
    const r = computeRoi(inputs({ annualRunCost: userOverride(12_000) }));
    expect(r.steadyStateGrossSavings).toBe(52_000);
    expect(r.steadyStateNetSavings).toBe(40_000);
  });

  it("scales savings by adoption rate", () => {
    const r = computeRoi(inputs({ adoptionRate: userOverride(0.5) }));
    expect(r.steadyStateAnnualHours).toBe(520);
    expect(r.steadyStateGrossSavings).toBe(26_000);
  });
});

describe("computeRoi — the adoption ramp", () => {
  it("reduces year-one savings below steady state", () => {
    const flat = computeRoi(inputs());
    const ramped = computeRoi(inputs({ rampMonths: userOverride(6) }));
    expect(ramped.year1GrossSavings).toBeLessThan(flat.year1GrossSavings);
  });

  it("costs exactly the ramp's lost months in year one", () => {
    // Linear ramp over 6 months: multipliers 1/6..6/6 for months 1-6, then 1.0
    // for months 7-12. Sum = 3.5 + 6 = 9.5 month-equivalents out of 12.
    const r = computeRoi(inputs({ rampMonths: userOverride(6) }));
    expect(r.year1GrossSavings).toBe(Math.round((52_000 / 12) * 9.5));
  });

  it("leaves year one untouched when the ramp is zero", () => {
    const r = computeRoi(inputs());
    expect(r.year1GrossSavings).toBe(52_000);
  });
});

describe("computeRoi — payback", () => {
  it("reports the first month cumulative net turns positive", () => {
    // $52k/yr gross => ~$4,333/mo. A $13k build pays back during month 3.
    const r = computeRoi(inputs({ implementationCost: userOverride(13_000) }));
    expect(r.paybackMonths).toBe(3);
  });

  it("returns null rather than a fake number when it never pays back", () => {
    const r = computeRoi(
      inputs({
        implementationCost: userOverride(5_000_000),
        annualRunCost: userOverride(80_000),
      }),
    );
    expect(r.paybackMonths).toBeNull();
    expect(r.threeYearNetSavings).toBeLessThan(0);
  });

  it("shows year one negative when the build outweighs first-year savings", () => {
    const r = computeRoi(inputs({ implementationCost: userOverride(80_000) }));
    expect(r.year1NetSavings).toBe(52_000 - 80_000);
    expect(r.year1NetSavings).toBeLessThan(0);
  });
});

describe("computeRoi — guards against bad model output", () => {
  it("clamps an out-of-range automation potential instead of inflating savings", () => {
    const r = computeRoi(inputs({ automationPotential: userOverride(1.4) }));
    // Clamped to 1.0 => all 2080 h automatable, not 2912.
    expect(r.automatableAnnualHours).toBe(2080);
  });

  it("clamps a negative adoption rate to zero", () => {
    const r = computeRoi(inputs({ adoptionRate: userOverride(-0.3) }));
    expect(r.steadyStateGrossSavings).toBe(0);
  });
});

describe("computeRoi — assumption and confidence surfacing", () => {
  it("lists every input flagged as an assumption", () => {
    const r = computeRoi(
      inputs({
        loadedHourlyCost: benchmark(50, "band"),
        adoptionRate: benchmark(1, "band"),
      }),
    );
    expect(r.assumptionKeys).toEqual(["loadedHourlyCost", "adoptionRate"]);
  });

  it("reports the weakest input rather than averaging confidence away", () => {
    const r = computeRoi(
      inputs({
        hoursPerWeek: {
          value: 10,
          source: "model_proposed",
          isAssumption: false,
          confidence: 0.4,
          basis: "SOP quote",
          evidenceIds: ["chunk-1"],
        },
      }),
    );
    expect(r.weakestInput).toEqual({ key: "hoursPerWeek", confidence: 0.4 });
  });

  it("reports no assumptions when every input is user-set", () => {
    expect(computeRoi(inputs()).assumptionKeys).toEqual([]);
  });
});

describe("computeRoi — monthly schedule", () => {
  it("returns exactly twelve months for the chart", () => {
    expect(computeRoi(inputs()).monthlySchedule).toHaveLength(12);
  });

  it("carries cumulative net forward month over month", () => {
    const r = computeRoi(inputs({ implementationCost: userOverride(13_000) }));
    const net = r.monthlySchedule.map((m) => m.cumulativeNet);
    expect(net[0]).toBeLessThan(0);
    expect(net[11]).toBeGreaterThan(0);
    // Monotonically increasing while savings are positive.
    for (let i = 1; i < net.length; i++) {
      expect(net[i]).toBeGreaterThan(net[i - 1]);
    }
  });
});
