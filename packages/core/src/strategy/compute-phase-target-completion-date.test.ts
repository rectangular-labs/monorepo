import { describe, expect, it } from "vitest";
import { computePhaseTargetCompletionDate } from "./compute-phase-target-completion-date";

describe("computePhaseTargetCompletionDate", () => {
  it("returns null for suggestion phases", () => {
    const result = computePhaseTargetCompletionDate({
      phaseStatus: "suggestion",
      cadence: {
        period: "weekly",
        frequency: 2,
        allowedDays: ["mon", "wed", "fri"],
      },
      contentCreationsCount: 10,
      contentUpdatesCount: 0,
      now: new Date("2026-01-05T10:00:00.000Z"),
    });

    expect(result).toBeNull();
  });

  it("uses cadence to compute completion date for created content", () => {
    const result = computePhaseTargetCompletionDate({
      phaseStatus: "planned",
      cadence: {
        period: "weekly",
        frequency: 2,
        allowedDays: ["mon", "wed"],
      },
      contentCreationsCount: 3,
      contentUpdatesCount: 0,
      now: new Date("2026-01-05T10:00:00.000Z"),
    });

    // week 1 (2026-01-05): Mon + Wed = 2, week 2 first slot is Mon (2026-01-12)
    expect(result?.toISOString()).toBe("2026-01-12T00:00:00.000Z");
  });

  it("falls back to default weekdays when cadence allowed days are empty", () => {
    const result = computePhaseTargetCompletionDate({
      phaseStatus: "planned",
      cadence: {
        period: "weekly",
        frequency: 2,
        allowedDays: [],
      },
      contentCreationsCount: 3,
      contentUpdatesCount: 0,
      now: new Date("2026-01-05T10:00:00.000Z"),
    });

    // schedule starts on next day (Tue), can place two in the same week, third in next week.
    expect(result?.toISOString()).toBe("2026-01-12T00:00:00.000Z");
  });

  it("returns now plus seven days for update-only phases", () => {
    const result = computePhaseTargetCompletionDate({
      phaseStatus: "in_progress",
      cadence: {
        period: "weekly",
        frequency: 2,
        allowedDays: ["mon", "wed"],
      },
      contentCreationsCount: 0,
      contentUpdatesCount: 4,
      now: new Date("2026-01-05T10:15:00.000Z"),
    });

    expect(result?.toISOString()).toBe("2026-01-12T10:15:00.000Z");
  });

  it("returns null when there are no creations or updates", () => {
    const result = computePhaseTargetCompletionDate({
      phaseStatus: "planned",
      cadence: {
        period: "weekly",
        frequency: 2,
        allowedDays: ["mon", "wed"],
      },
      contentCreationsCount: 0,
      contentUpdatesCount: 0,
      now: new Date("2026-01-05T10:00:00.000Z"),
    });

    expect(result).toBeNull();
  });

  it("respects monthly cadence frequency limits", () => {
    const result = computePhaseTargetCompletionDate({
      phaseStatus: "planned",
      cadence: {
        period: "monthly",
        frequency: 2,
        allowedDays: ["mon"],
      },
      contentCreationsCount: 3,
      contentUpdatesCount: 0,
      now: new Date("2026-01-05T10:00:00.000Z"),
    });

    // January capacity 2 on Mondays; third creation lands in February.
    expect(result?.toISOString()).toBe("2026-02-02T00:00:00.000Z");
  });
});
