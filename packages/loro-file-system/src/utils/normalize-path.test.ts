import { describe, expect, it } from "vitest";
import { normalizePath } from "./normalize-path";

describe("normalizePath", () => {
  it("should return '/' for an empty path or path with only whitespace or \".\"", () => {
    expect(normalizePath("")).toBe("/");
    expect(normalizePath("   ")).toBe("/");
    expect(normalizePath(".")).toBe("/");
    expect(normalizePath("./")).toBe("/");
    expect(normalizePath("/")).toBe("/");
  });
  it("should return '/a/b/c' for a path with multiple slashes", () => {
    expect(normalizePath("//a//b//c")).toBe("/a/b/c");
    expect(normalizePath("/a/b/c///")).toBe("/a/b/c");
    expect(normalizePath("//a//b//c")).toBe("/a/b/c");
  });
  it("should return '/a/b/c' for a malformed path", () => {
    expect(normalizePath("/a/b/c/")).toBe("/a/b/c");
    expect(normalizePath("a/b//c/")).toBe("/a/b/c");
  });
});
