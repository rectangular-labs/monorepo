// ======================================================
// MINUTES
// ======================================================

export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

export function setMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(minutes);
  return result;
}

export function differenceInMinutes(date1: Date, date2: Date): number {
  return Math.abs(Math.round((date2.getTime() - date1.getTime()) / 60000));
}

// ======================================================
// HOURS
// ======================================================

export function setHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(hours);
  return result;
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export function eachHourOfInterval(interval: {
  start: Date;
  end: Date;
}): Date[] {
  const result: Date[] = [];
  for (let i = interval.start.getHours(); i < interval.end.getHours(); i++) {
    result.push(addHours(interval.start, i));
  }
  return result;
}

// ======================================================
// DAYS
// ======================================================

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function differenceInDays(date1: Date, date2: Date): number {
  return Math.abs(Math.round((date2.getTime() - date1.getTime()) / 86400000));
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

// ======================================================
// WEEKS
// ======================================================

export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

export function subWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - weeks * 7);
  return result;
}

export function startOfWeek(
  date: Date,
  options?: { weekStartsOn?: 0 | 1 },
): Date {
  const result = new Date(date);
  result.setDate(
    result.getDate() - result.getDay() + (options?.weekStartsOn ?? 0),
  );
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfWeek(
  date: Date,
  options?: { weekStartsOn?: 0 | 1 },
): Date {
  const result = new Date(date);
  console.log("result", result);
  console.log("result.getDay()", result.getDay());

  result.setDate(
    result.getDate() + (7 - result.getDay()) + (options?.weekStartsOn ?? 0) - 1,
  );
  result.setHours(23, 59, 59, 999);
  return result;
}

// ======================================================
// MONTHS
// ======================================================

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function subMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
}

export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(
    new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate(),
  );
  result.setHours(23, 59, 59, 999);
  return result;
}

// ======================================================
// COMPARISONS
// ======================================================

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

export function isPast(date: Date): boolean {
  return date < new Date();
}

export function isFuture(date: Date): boolean {
  return date > new Date();
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

// ======================================================
// INTERVALS
// ======================================================

export function areIntervalsOverlapping(
  interval1: { start: Date; end: Date },
  interval2: { start: Date; end: Date },
): boolean {
  return interval1.start < interval2.end && interval1.end > interval2.start;
}

export function isWithinInterval(
  date: Date,
  interval: { start: Date; end: Date },
): boolean {
  return date >= interval.start && date <= interval.end;
}
