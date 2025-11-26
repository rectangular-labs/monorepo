import { describe, expect, it } from "vitest";
import { splitPath } from "./split-path";

describe("splitPath", () => {
  it("should split a path into segments", () => {
    expect(splitPath("a")).toEqual(["a"]);
    expect(splitPath("/a")).toEqual(["a"]);
    expect(splitPath("/a///")).toEqual(["a"]);
    expect(splitPath("/a/b/c")).toEqual(["a", "b", "c"]);
    expect(splitPath("/a/b/c/")).toEqual(["a", "b", "c"]);
    expect(splitPath("/a/b/c//")).toEqual(["a", "b", "c"]);
    expect(splitPath("//a//b//c//")).toEqual(["a", "b", "c"]);
  });
  it('should return an empty array for an empty path, path with only whitespace or "." or "/"', () => {
    expect(splitPath("")).toEqual([]);
    expect(splitPath("  ")).toEqual([]);
    expect(splitPath(".")).toEqual([]);
    expect(splitPath("/")).toEqual([]);
    expect(splitPath("./")).toEqual([]);
  });
});
