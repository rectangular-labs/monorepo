export function isoToDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  // `datetime-local` expects a *local* date-time string without timezone.
  // Convert the instant to local time, then format as `YYYY-MM-DDTHH:mm`.
  const tzOffsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}
