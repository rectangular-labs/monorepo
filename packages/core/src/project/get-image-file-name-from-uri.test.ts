import { describe, expect, it } from "vitest";
import { getImageFileNameFromUri } from "./get-image-file-name-from-uri";

describe("getImageFileNameFromUri", () => {
  it("returns the file name from a uri", () => {
    expect(
      getImageFileNameFromUri("org_123/proj_456/style-reference/123__test.jpg"),
    ).toBe("test.jpg");
  });

  it("returns the file name from a uri with a subdirectory", () => {
    expect(
      getImageFileNameFromUri(
        "org_123/proj_456/style-reference/123__test/subdir/test.jpg",
      ),
    ).toBe("test/subdir/test.jpg");
  });

  it("returns the file name from a url with a query string", () => {
    expect(
      getImageFileNameFromUri(
        "https://example.com/org_123/proj_456/style-reference/123__test.jpg?X-Amz-Expires=3600",
      ),
    ).toBe("test.jpg");
  });
});


