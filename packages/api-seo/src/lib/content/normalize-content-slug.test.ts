import { describe, expect, it } from "vitest";
import { normalizeContentSlug } from "./normalize-content-slug";

describe("normalizeContentSlug", () => {
  it("returns empty for blank or root paths", () => {
    expect(normalizeContentSlug("")).toBe("");
    expect(normalizeContentSlug(" / ")).toBe("");
  });

  it("normalizes slashes without touching extensions", () => {
    expect(normalizeContentSlug(" /foo//bar.md ")).toBe("foo/bar.md");
    expect(normalizeContentSlug("/foo/bar.MDX")).toBe("foo/bar.MDX");
  });
});
