import { describe, expect, it } from "vitest";
import { getExtensionFromMimeType } from "./get-extension-from-mimetype";

describe("getExtensionFromMimeType", () => {
  it("returns known extensions", () => {
    expect(getExtensionFromMimeType("image/jpeg")).toBe("jpg");
    expect(getExtensionFromMimeType("image/png")).toBe("png");
    expect(getExtensionFromMimeType("image/gif")).toBe("gif");
    expect(getExtensionFromMimeType("image/webp")).toBe("webp");
  });

  it("defaults to jpg for unknown mime types", () => {
    expect(getExtensionFromMimeType("image/svg+xml")).toBe("jpg");
    expect(getExtensionFromMimeType("application/octet-stream")).toBe("jpg");
  });
});


