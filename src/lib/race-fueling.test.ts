import { describe, it, expect } from "vitest";
import {
  calculateRaceFueling,
  formatMinutes,
  type Intensity,
} from "./race-fueling";

// ─── CEO acceptance test ────────────────────────────────────────────────────

describe("acceptance test: 4h moderate 70kg", () => {
  const r = calculateRaceFueling(4, "moderate", 70, null);

  it("carbPerHr = 60", () => expect(r.carbPerHr).toBe(60));
  it("gelsPerHr = 2", () => expect(r.gelsPerHr).toBe(2));
  it("gelCarbsPerHr = 50", () => expect(r.gelCarbsPerHr).toBe(50));
  it("drinkCarbsPerHr = 10", () => expect(r.drinkCarbsPerHr).toBe(10));
  it("fluidMlPerHr = 500 (default)", () => expect(r.fluidMlPerHr).toBe(500));
  it("solidFoodOk = true", () => expect(r.solidFoodOk).toBe(true));
  it("solidFoodAtMin = 180", () => expect(r.solidFoodAtMin).toBe(180));
  it("multiSourceRequired = false", () =>
    expect(r.multiSourceRequired).toBe(false));
});

// ─── Carb targets ───────────────────────────────────────────────────────────

describe("carb targets per intensity", () => {
  it("low → 45g/hr", () =>
    expect(calculateRaceFueling(2, "low", 70, null).carbPerHr).toBe(45));
  it("moderate → 60g/hr", () =>
    expect(calculateRaceFueling(2, "moderate", 70, null).carbPerHr).toBe(60));
  it("high → 75g/hr", () =>
    expect(calculateRaceFueling(2, "high", 70, null).carbPerHr).toBe(75));
  it("max → 90g/hr", () =>
    expect(calculateRaceFueling(2, "max", 70, null).carbPerHr).toBe(90));
});

// ─── Gel caps ───────────────────────────────────────────────────────────────

describe("gel cap at 2/hr", () => {
  it("high: 75g → 2 gels (50g), 25g drink", () => {
    const r = calculateRaceFueling(2, "high", 70, null);
    expect(r.gelsPerHr).toBe(2);
    expect(r.gelCarbsPerHr).toBe(50);
    expect(r.drinkCarbsPerHr).toBe(25);
  });
  it("max: 90g → 2 gels (50g), 40g drink", () => {
    const r = calculateRaceFueling(2, "max", 70, null);
    expect(r.gelsPerHr).toBe(2);
    expect(r.gelCarbsPerHr).toBe(50);
    expect(r.drinkCarbsPerHr).toBe(40);
  });
  it("low: 45g → 1 gel (25g), 20g drink", () => {
    const r = calculateRaceFueling(2, "low", 70, null);
    expect(r.gelsPerHr).toBe(1);
    expect(r.gelCarbsPerHr).toBe(25);
    expect(r.drinkCarbsPerHr).toBe(20);
  });
});

// ─── Fluid targets ──────────────────────────────────────────────────────────

describe("fluid targets", () => {
  it("default 500ml/hr when sweatRate=null", () =>
    expect(calculateRaceFueling(2, "moderate", 70, null).fluidMlPerHr).toBe(
      500
    ));
  it("default 500ml/hr when sweatRate=0", () =>
    expect(calculateRaceFueling(2, "moderate", 70, 0).fluidMlPerHr).toBe(500));
  it("uses sweat rate when provided", () =>
    expect(calculateRaceFueling(2, "moderate", 70, 800).fluidMlPerHr).toBe(
      800
    ));
  it("uses sweat rate for high values", () =>
    expect(calculateRaceFueling(2, "max", 70, 1200).fluidMlPerHr).toBe(1200));
});

// ─── Solid food rules ────────────────────────────────────────────────────────

describe("solid food rules", () => {
  it("low + 4h → solid food OK at 3h", () => {
    const r = calculateRaceFueling(4, "low", 70, null);
    expect(r.solidFoodOk).toBe(true);
    expect(r.solidFoodAtMin).toBe(180);
  });
  it("moderate + 4h → solid food OK at 3h", () => {
    const r = calculateRaceFueling(4, "moderate", 70, null);
    expect(r.solidFoodOk).toBe(true);
    expect(r.solidFoodAtMin).toBe(180);
  });
  it("high + 4h → no solid food (intensity too high)", () => {
    const r = calculateRaceFueling(4, "high", 70, null);
    expect(r.solidFoodOk).toBe(false);
    expect(r.solidFoodAtMin).toBeNull();
  });
  it("max + 4h → no solid food", () => {
    const r = calculateRaceFueling(4, "max", 70, null);
    expect(r.solidFoodOk).toBe(false);
    expect(r.solidFoodAtMin).toBeNull();
  });
  it("moderate + 3h → no solid food (duration must be strictly > 3h)", () => {
    const r = calculateRaceFueling(3, "moderate", 70, null);
    expect(r.solidFoodOk).toBe(false);
    expect(r.solidFoodAtMin).toBeNull();
  });
  it("moderate + 2h → no solid food", () => {
    const r = calculateRaceFueling(2, "moderate", 70, null);
    expect(r.solidFoodOk).toBe(false);
    expect(r.solidFoodAtMin).toBeNull();
  });
  it("low + 3.5h → solid food OK", () => {
    const r = calculateRaceFueling(3.5, "low", 70, null);
    expect(r.solidFoodOk).toBe(true);
    expect(r.solidFoodAtMin).toBe(180);
  });
});

// ─── Multi-source requirement ────────────────────────────────────────────────

describe("multiSourceRequired", () => {
  it("low → false", () =>
    expect(
      calculateRaceFueling(2, "low", 70, null).multiSourceRequired
    ).toBe(false));
  it("moderate → false", () =>
    expect(
      calculateRaceFueling(2, "moderate", 70, null).multiSourceRequired
    ).toBe(false));
  it("high → true", () =>
    expect(
      calculateRaceFueling(2, "high", 70, null).multiSourceRequired
    ).toBe(true));
  it("max → true", () =>
    expect(
      calculateRaceFueling(2, "max", 70, null).multiSourceRequired
    ).toBe(true));
});

// ─── Gel schedule ────────────────────────────────────────────────────────────

describe("gel schedule: 2 gels/hr (moderate/high/max)", () => {
  it("first gel always at 20min", () => {
    const r = calculateRaceFueling(2, "moderate", 70, null);
    expect(r.gelSchedule[0].minuteFromStart).toBe(20);
  });
  it("2 gels/hr → 30min intervals after first", () => {
    const r = calculateRaceFueling(2, "moderate", 70, null);
    // 120min race: gels at 20, 50, 80, 110
    const times = r.gelSchedule.map((g) => g.minuteFromStart);
    expect(times).toEqual([20, 50, 80, 110]);
  });
  it("labels count from 1", () => {
    const r = calculateRaceFueling(2, "moderate", 70, null);
    expect(r.gelSchedule[0].label).toBe("Gel 1");
    expect(r.gelSchedule[1].label).toBe("Gel 2");
  });
  it("no gel at exactly race duration", () => {
    const r = calculateRaceFueling(1, "moderate", 70, null); // 60min
    // 2/hr: gels at 20, 50 — 80 would be >= 60, excluded
    const times = r.gelSchedule.map((g) => g.minuteFromStart);
    expect(times).toEqual([20, 50]);
  });
});

describe("gel schedule: 1 gel/hr (low)", () => {
  it("1 gel/hr → 60min intervals after first", () => {
    const r = calculateRaceFueling(3, "low", 70, null);
    // 180min race: gels at 20, 80, 140
    const times = r.gelSchedule.map((g) => g.minuteFromStart);
    expect(times).toEqual([20, 80, 140]);
  });
  it("1 gel/hr 2h race: gels at 20, 80", () => {
    const r = calculateRaceFueling(2, "low", 70, null);
    const times = r.gelSchedule.map((g) => g.minuteFromStart);
    expect(times).toEqual([20, 80]);
  });
});

describe("gel schedule: short race", () => {
  it("30min race → 1 gel at 20min", () => {
    const r = calculateRaceFueling(0.5, "moderate", 70, null);
    const times = r.gelSchedule.map((g) => g.minuteFromStart);
    expect(times).toEqual([20]);
  });
  it("15min race (hypothetical) → no gels if first gel >= duration", () => {
    // 20min first gel, 15min race → empty. But min duration is 0.5h=30min so 20 < 30
    const r = calculateRaceFueling(0.5, "moderate", 70, null);
    expect(r.gelSchedule.length).toBeGreaterThan(0);
  });
});

// ─── formatMinutes ──────────────────────────────────────────────────────────

describe("formatMinutes", () => {
  it("0 → '0:00'", () => expect(formatMinutes(0)).toBe("0:00"));
  it("20 → '0:20'", () => expect(formatMinutes(20)).toBe("0:20"));
  it("60 → '1:00'", () => expect(formatMinutes(60)).toBe("1:00"));
  it("80 → '1:20'", () => expect(formatMinutes(80)).toBe("1:20"));
  it("180 → '3:00'", () => expect(formatMinutes(180)).toBe("3:00"));
  it("135 → '2:15'", () => expect(formatMinutes(135)).toBe("2:15"));
  it("pads single-digit minutes", () => expect(formatMinutes(61)).toBe("1:01"));
});

// ─── Edge / guard cases ──────────────────────────────────────────────────────

describe("guard cases", () => {
  it("throws for duration <= 0", () =>
    expect(() => calculateRaceFueling(0, "moderate", 70, null)).toThrow());
  it("throws for weight <= 0", () =>
    expect(() => calculateRaceFueling(2, "moderate", 0, null)).toThrow());
  it("weight doesn't affect carb/gel calculation (engine is weight-agnostic)", () => {
    const r60 = calculateRaceFueling(2, "moderate", 60, null);
    const r80 = calculateRaceFueling(2, "moderate", 80, null);
    expect(r60.carbPerHr).toBe(r80.carbPerHr);
    expect(r60.gelsPerHr).toBe(r80.gelsPerHr);
  });
  it("long race (24h) doesn't error", () =>
    expect(() =>
      calculateRaceFueling(24, "low", 70, null)
    ).not.toThrow());
  it("drinkCarbsPerHr never negative", () => {
    const intensities: Intensity[] = ["low", "moderate", "high", "max"];
    for (const intensity of intensities) {
      const r = calculateRaceFueling(2, intensity, 70, null);
      expect(r.drinkCarbsPerHr).toBeGreaterThanOrEqual(0);
    }
  });
});
