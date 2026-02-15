export function formatNullablePercent(
  value: number | null,
  {
    fallback = "N/A",
    fractionDigits = 1,
  }: { fallback?: string; fractionDigits?: number } = {},
): string {
  if (value === null) return fallback;
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

export function formatNullableSignedPercent(
  value: number | null,
  {
    fallback = "N/A",
    fractionDigits = 1,
  }: { fallback?: string; fractionDigits?: number } = {},
): string {
  if (value === null) return fallback;
  const percent = value * 100;
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(fractionDigits)}%`;
}
