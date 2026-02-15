import type {
  PublishingCadence,
  StrategyPhaseStatus,
} from "../schemas/strategy-parsers";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DEFAULT_ALLOWED_DAYS = ["mon", "tue", "wed", "thu", "fri"] as const;

// TODO: consolidate all the date utils with the date utils in UI and move these to /core package
function addDaysUtc(date: Date, days: number) {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value;
}

function startOfDayUtc(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function utcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPeriodKey(date: Date, period: PublishingCadence["period"]) {
  if (period === "daily") return utcDateKey(date);

  if (period === "weekly") {
    const monday = startOfDayUtc(date);
    const offsetToMonday = (monday.getUTCDay() + 6) % 7;
    monday.setUTCDate(monday.getUTCDate() - offsetToMonday);
    return utcDateKey(monday);
  }

  // monthly
  return date.toISOString().slice(0, 7);
}

function calculateCreationScheduleCompletionDate(args: {
  articleCount: number;
  cadence: PublishingCadence;
  now: Date;
}) {
  const { articleCount, cadence, now } = args;
  if (articleCount <= 0) return null;

  const allowedDays =
    cadence.allowedDays.length > 0
      ? new Set(cadence.allowedDays)
      : new Set<PublishingCadence["allowedDays"][number]>(DEFAULT_ALLOWED_DAYS);

  let remaining = articleCount;
  let cursor = addDaysUtc(startOfDayUtc(now), 1);
  const usedCapacityByPeriod = new Map<string, number>();

  // Defensive upper bound for malformed cadence data.
  for (let i = 0; i < 5000; i += 1) {
    const weekday = WEEKDAY_KEYS[cursor.getUTCDay()] ?? "sun";
    if (!allowedDays.has(weekday)) {
      cursor = addDaysUtc(cursor, 1);
      continue;
    }

    const periodKey = getPeriodKey(cursor, cadence.period);
    const usedCapacity = usedCapacityByPeriod.get(periodKey) ?? 0;
    const availableCapacity = Math.max(0, cadence.frequency - usedCapacity);

    if (availableCapacity > 0) {
      const scheduledToday = Math.min(availableCapacity, remaining);
      remaining -= scheduledToday;
      usedCapacityByPeriod.set(periodKey, usedCapacity + scheduledToday);

      if (remaining === 0) return new Date(cursor);
    }

    cursor = addDaysUtc(cursor, 1);
  }

  throw new Error("Unable to compute completion date from cadence.");
}

export function computePhaseTargetCompletionDate(args: {
  phaseStatus: StrategyPhaseStatus;
  cadence: PublishingCadence;
  contentCreationsCount: number;
  contentUpdatesCount: number;
  now: Date;
}) {
  if (args.phaseStatus === "suggestion") return null;

  if (args.contentCreationsCount > 0) {
    return calculateCreationScheduleCompletionDate({
      articleCount: args.contentCreationsCount,
      cadence: args.cadence,
      now: args.now,
    });
  }

  if (args.contentUpdatesCount > 0) {
    return addDaysUtc(args.now, 7);
  }

  return null;
}
