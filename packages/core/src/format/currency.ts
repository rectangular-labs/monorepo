export function formatNullableCurrency(
  value: number | null,
  {
    fallback = "N/A",
    currency = "USD",
    locale = "en-US",
    maximumFractionDigits = 2,
  }: {
    fallback?: string;
    currency?: string;
    locale?: string;
    maximumFractionDigits?: number;
  } = {},
): string {
  if (value === null) return fallback;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(value);
}
