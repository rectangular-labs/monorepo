export function formatNullableNumber(
  value: number | null,
  {
    fallback = "N/A",
    maximumFractionDigits = 0,
  }: { fallback?: string; maximumFractionDigits?: number } = {},
): string {
  if (value === null) return fallback;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}
