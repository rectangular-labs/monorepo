import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { captureScreenshotOne } from "./image-tools.capture-screenshotone";

const TEST_FILE_DIR = path.dirname(fileURLToPath(import.meta.url));
const API_SEO_PACKAGE_ROOT = path.resolve(TEST_FILE_DIR, "../../../..");
const OUTPUT_DIR = path.join(API_SEO_PACKAGE_ROOT, ".cache", "screenshotone");

function extensionFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

function safeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function writeScreenshotBytes(args: {
  url: string;
  bytes: Uint8Array;
  contentType: string;
}): Promise<string> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const parsedUrl = new URL(args.url);
  const slugBase = safeSlug(`${parsedUrl.hostname}${parsedUrl.pathname}`);
  const hash = createHash("sha1").update(args.url).digest("hex").slice(0, 10);
  const ext = extensionFromContentType(args.contentType);
  const filePath = path.join(
    OUTPUT_DIR,
    `${slugBase || "screenshot"}-${hash}.${ext}`,
  );
  await writeFile(filePath, args.bytes);
  return filePath;
}

describe.skip("image-tools.capture-screenshotone (real API)", () => {
  it("captures a screenshot for https://www.gartner.com/en", async () => {
    // has captcha by default
    const result = await captureScreenshotOne({
      url: "https://www.gartner.com/en",
      viewport: { width: 1280, height: 720 },
    });

    if (!result.ok) throw result.error;
    expect(result.value.url).toEqual("https://www.gartner.com/en");
    expect(result.value.contentType).toMatch(/^image\//);
    expect(result.value.bytes.length).toBeGreaterThan(10_000);
    const filePath = await writeScreenshotBytes(result.value);
    expect(filePath).toContain(
      `${path.sep}.cache${path.sep}screenshotone${path.sep}`,
    );
  }, 120_000);

  it("captures a screenshot for https://www.keyence.com/products/software/rpa/applications/bank-reconciliation.jsp", async () => {
    // has cookie banner by default
    const url =
      "https://www.keyence.com/products/software/rpa/applications/bank-reconciliation.jsp";
    const result = await captureScreenshotOne({
      url,
      viewport: { width: 1280, height: 720 },
    });

    if (!result.ok) throw result.error;
    expect(result.value.url).toEqual(url);
    expect(result.value.contentType).toMatch(/^image\//);
    expect(result.value.bytes.length).toBeGreaterThan(10_000);

    const filePath = await writeScreenshotBytes(result.value);
    expect(filePath).toContain(
      `${path.sep}.cache${path.sep}screenshotone${path.sep}`,
    );
  }, 120_000);

  it("captures a screenshot for https://dext.com/en", async () => {
    // has cookie banner by default
    const result = await captureScreenshotOne({
      url: "https://dext.com/en",
      viewport: { width: 1280, height: 720 },
    });

    if (!result.ok) throw result.error;
    expect(result.value.url).toEqual("https://dext.com/en");
    expect(result.value.contentType).toMatch(/^image\//);
    expect(result.value.bytes.length).toBeGreaterThan(10_000);
    const filePath = await writeScreenshotBytes(result.value);
    expect(filePath).toContain(
      `${path.sep}.cache${path.sep}screenshotone${path.sep}`,
    );
  }, 120_000);
});
