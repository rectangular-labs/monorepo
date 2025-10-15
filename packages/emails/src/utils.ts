import type { EmailAddress } from "./types";

export function normalizeEmailAddressToString(
  addr: string | EmailAddress,
): string {
  if (typeof addr === "string") return addr;
  return addr.name ? `"${addr.name}" <${addr.address}>` : addr.address;
}

export function normalizeEmailAddressesToString(
  addresses?: string | string[] | EmailAddress | EmailAddress[],
): string[] {
  if (!addresses) return [];
  if (Array.isArray(addresses)) {
    return addresses.map(normalizeEmailAddressToString);
  }
  return [normalizeEmailAddressToString(addresses)];
}

export function normalizeEmailAddressToObject(addr: string | EmailAddress): {
  name?: string;
  email: string;
} {
  if (typeof addr === "string") {
    return { email: addr };
  }
  return { name: addr.name || "", email: addr.address };
}

export function normalizeEmailAddressesToObject(
  addresses?: string | string[] | EmailAddress | EmailAddress[],
): { name?: string; email: string }[] {
  if (!addresses) return [];
  if (Array.isArray(addresses)) {
    return addresses.map(normalizeEmailAddressToObject);
  }
  return [normalizeEmailAddressToObject(addresses)];
}
