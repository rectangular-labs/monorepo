export function toSlug(input: string) {
  return (
    input
      .toLowerCase()
      .trim()
      // replace all non-alphanumeric characters with a hyphen
      .replace(/[^a-z0-9]+/g, "-")
      // replace any names starting with a hyphen or ending with a hyphen
      .replace(/^-+|-+$/g, "")
  );
}
