import { describe, expect, it } from "vitest";
import { getMimeTypeFromFileName } from "./get-mimetype-from-filename";

describe("getMimeTypeFromFileName", () => {
  it("returns known mime types by extension", () => {
    expect(getMimeTypeFromFileName("photo.jpg")).toBe("image/jpeg");
    expect(getMimeTypeFromFileName("photo.png")).toBe("image/png");
    expect(getMimeTypeFromFileName("photo.gif")).toBe("image/gif");
    expect(getMimeTypeFromFileName("photo.webp")).toBe("image/webp");
  });

  it("defaults to image/jpeg for unknown or missing extensions", () => {
    expect(getMimeTypeFromFileName("photo.jpeg")).toBe("image/jpeg");
    expect(getMimeTypeFromFileName("photo")).toBe("image/jpeg");
    expect(getMimeTypeFromFileName("PHOTO.JPG")).toBe("image/jpeg");
  });
});
