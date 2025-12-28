export function getInitials(name: string, delineator?: string) {
  return name
    .split(delineator ?? " ")
    .map((n: string) => n[0])
    .join("");
}
