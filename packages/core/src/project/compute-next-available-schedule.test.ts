import { describe, expect, it, vi } from "vitest";
import {
  computeNextAvailableScheduleIso,
  type ContentItemSnapshot,
} from "./compute-next-available-schedule";

const makeItem = (
  status: ContentItemSnapshot["status"],
  scheduledFor: string | null,
): ContentItemSnapshot => ({ status, scheduledFor });

describe("computeNextAvailableScheduleIso", () => {
  it("returns undefined when allowedDays is empty", () => {
    const result = computeNextAvailableScheduleIso({
      cadence: { allowedDays: [], period: "daily", frequency: 1 },
      scheduledItems: [],
    });

    expect(result).toBeUndefined();
  });

  it("computes the next available slot on an allowed day, accounting for per-day capacity and time slots", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T08:00:00.000Z")); // Monday, before 9am UTC

    const dayKey = "2026-01-05";
    const result = computeNextAvailableScheduleIso({
      cadence: { allowedDays: ["mon"], period: "daily", frequency: 3 },
      scheduledItems: [
        makeItem("queued", `${dayKey}T09:00:00.000Z`),
        makeItem("scheduled", `${dayKey}T11:00:00.000Z`),
        makeItem("published", `${dayKey}T13:00:00.000Z`),
        makeItem("queued", "not-a-date"),
      ],
    });

    // 3 already counted for the day, so next slot is the next allowed day (next Monday) at 9am UTC
    expect(result).toBe("2026-01-12T09:00:00.000Z");

    vi.useRealTimers();
  });

  it("starts from tomorrow if today's 9am UTC is already in the past", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T10:00:00.000Z")); // Monday, after 9am UTC

    const result = computeNextAvailableScheduleIso({
      cadence: {
        allowedDays: ["mon", "tue"],
        period: "daily",
        frequency: 1,
      },
      scheduledItems: [],
    });

    expect(result).toBe("2026-01-06T09:00:00.000Z"); // Tuesday 9am

    vi.useRealTimers();
  });

  it("schedules weekly cadences only on allowed days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T08:00:00.000Z")); // Monday, before 9am UTC

    // weekly frequency=3, allowedDays=[mon, wed] => maxPerAllowedDay=ceil(3/2)=2
    // If Monday already has 1 scheduled item, the next slot should be Monday 11am.
    const monday = "2026-01-05";
    const result = computeNextAvailableScheduleIso({
      cadence: {
        allowedDays: ["mon", "wed"],
        period: "weekly",
        frequency: 3,
      },
      scheduledItems: [makeItem("queued", `${monday}T09:00:00.000Z`)],
    });

    expect(result).toBe("2026-01-05T11:00:00.000Z"); // Monday 11am

    vi.useRealTimers();
  });

  it("schedules weekly cadences only on allowed days and respects per-day capacity derived from frequency", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T08:00:00.000Z")); // Monday, before 9am UTC

    // weekly frequency=3, allowedDays=[mon, wed] => maxPerAllowedDay=ceil(3/2)=2
    // If Monday already has 2 scheduled items, the next slot should be Wednesday 9am.
    const monday = "2026-01-05";
    const result = computeNextAvailableScheduleIso({
      cadence: {
        allowedDays: ["mon", "wed"],
        period: "weekly",
        frequency: 3,
      },
      scheduledItems: [
        makeItem("queued", `${monday}T09:00:00.000Z`),
        makeItem("scheduled", `${monday}T11:00:00.000Z`),
      ],
    });

    expect(result).toBe("2026-01-07T09:00:00.000Z"); // Wednesday 9am

    vi.useRealTimers();
  });

  it("schedules weekly cadences will bump to following week if no slots are available", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T08:00:00.000Z")); // Monday, before 9am UTC

    // weekly frequency=3, allowedDays=[mon, wed] => maxPerAllowedDay=ceil(3/2)=2
    // If Monday already has 2 scheduled items, and Wednesday already has 1 scheduled item, the next slot should be following week's Monday 9am.
    const monday = "2026-01-05";
    const wednesday = "2026-01-07";
    const result = computeNextAvailableScheduleIso({
      cadence: {
        allowedDays: ["mon", "wed"],
        period: "weekly",
        frequency: 3,
      },
      scheduledItems: [
        makeItem("queued", `${monday}T09:00:00.000Z`),
        makeItem("scheduled", `${monday}T11:00:00.000Z`),
        makeItem("scheduled", `${wednesday}T09:00:00.000Z`),
      ],
    });

    expect(result).toBe("2026-01-12T09:00:00.000Z"); // following week's Monday 9am

    vi.useRealTimers();
  });

  it("schedules monthly cadences only on allowed days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T08:00:00.000Z")); // Monday, before 9am UTC

    // monthly frequency=7, allowedDays=[tue, thu] => maxPerAllowedDay=ceil(7/(2*4))=1
    // If Tuesday and Thursday already has 1 scheduled item, the next slot should be the following week's Tuesday 9am.
    const tuesday = "2026-01-06";
    const thursday = "2026-01-08";
    const result = computeNextAvailableScheduleIso({
      cadence: {
        allowedDays: ["tue", "thu"],
        period: "monthly",
        frequency: 7,
      },
      scheduledItems: [
        makeItem("queued", `${tuesday}T09:00:00.000Z`),
        makeItem("scheduled", `${thursday}T09:00:00.000Z`),
      ],
    });

    expect(result).toBe("2026-01-13T09:00:00.000Z"); // following week's Tuesday 9am

    vi.useRealTimers();
  });

  it("schedules monthly cadences will bump to following month if no slots are available", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T08:00:00.000Z")); // Monday, before 9am UTC

    // monthly frequency=3, allowedDays=[tue, thu] => maxPerAllowedDay=ceil(3/(2*4))=1
    // If Tuesday, Thursday, and the following week's Tuesday already has 1 scheduled item, the next slot should be following month's Tuesday 9am.
    const tuesday = "2026-01-06";
    const thursday = "2026-01-08";
    const followingTuesday = "2026-01-13";
    const result = computeNextAvailableScheduleIso({
      cadence: {
        allowedDays: ["tue", "thu"],
        period: "monthly",
        frequency: 3,
      },
      scheduledItems: [
        makeItem("queued", `${tuesday}T09:00:00.000Z`),
        makeItem("scheduled", `${thursday}T09:00:00.000Z`),
        makeItem("scheduled", `${followingTuesday}T09:00:00.000Z`),
      ],
    });

    expect(result).toBe("2026-02-03T09:00:00.000Z"); // Following month's Tuesday 9am

    vi.useRealTimers();
  });
});
