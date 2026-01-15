import { describe, expect, it } from "vitest";
import { normalizeContentSlug } from "./normalize-content-slug";

describe("normalizeContentSlug", () => {
  it("returns empty for blank or root paths", () => {
    expect(normalizeContentSlug("")).toBe("");
    expect(normalizeContentSlug(" / ")).toBe("/");
    expect(normalizeContentSlug("/")).toBe("/");
  });
  it("returns the same path for a valid path", () => {
    expect(normalizeContentSlug("/foo/bar")).toBe("/foo/bar");
    expect(normalizeContentSlug("/foo/bar/")).toBe("/foo/bar");
    expect(normalizeContentSlug("/foo/bar//")).toBe("/foo/bar");
    expect(normalizeContentSlug("/foo/bar//baz")).toBe("/foo/bar/baz");
    expect(normalizeContentSlug("/foo/bar//baz/")).toBe("/foo/bar/baz");
  });
  it("removes duplicate slashes", () => {
    expect(normalizeContentSlug("/foo///bar/")).toBe("/foo/bar");
    expect(normalizeContentSlug("//foo/bar//")).toBe("/foo/bar");
    expect(normalizeContentSlug("//foo//bar//baz/")).toBe("/foo/bar/baz");
  });
  it("removes leading slashes", () => {
    expect(normalizeContentSlug("//foo/bar")).toBe("/foo/bar");
    expect(normalizeContentSlug("///foo/bar")).toBe("/foo/bar");
    expect(normalizeContentSlug("////foo/bar")).toBe("/foo/bar");
  });
  it("removes trailing slashes", () => {
    expect(normalizeContentSlug("/foo/bar/")).toBe("/foo/bar");
    expect(normalizeContentSlug("/foo/bar//")).toBe("/foo/bar");
    expect(normalizeContentSlug("/foo/bar///")).toBe("/foo/bar");
  });
});
