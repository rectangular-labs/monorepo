import { Buffer } from "node:buffer";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { safe } from "@rectangular-labs/result";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import Cloudflare from "cloudflare";
import { Jimp } from "jimp";
import { apiEnv } from "../../../env";

const screenshotInputSchema = type({
  url: "string",
  "userAgent?": "string",
  "screenshotOptions?": type({
    "fullPage?": "boolean",
    "omitBackground?": "boolean",
    "type?": "'png' | 'jpeg' | 'webp'",
    "quality?": "number",
    "clip?": type({
      x: "number",
      y: "number",
      width: "number",
      height: "number",
    }),
  }),
  "viewport?": type({
    width: "number",
    height: "number",
    "deviceScaleFactor?": "number",
  }),
  "gotoOptions?": type({
    "waitUntil?":
      "'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'",
    "timeout?": "number",
    "referer?": "string",
  }),
});

export function createScreenshotTool() {
  const env = apiEnv();
  const client = new Cloudflare({
    apiToken: env.CLOUDFLARE_BROWSER_RENDERING_API_TOKEN,
  });

  const screenshot = tool({
    description:
      "Capture a rendered screenshot of a given website URL. Returns a base64 screenshot string plus optional metadata; you can control the viewport, and common screenshot options.",
    inputSchema: jsonSchema<typeof screenshotInputSchema.infer>(
      screenshotInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({
      url,
      userAgent,
      screenshotOptions,
      viewport,
      gotoOptions,
    }) {
      if (!url) {
        return {
          success: false,
          message: "Provide either a URL or HTML to capture.",
        };
      }

      const screenshotOptionsWithEncoding = {
        ...(screenshotOptions ?? {}),
        encoding: "base64" as const,
      };

      const screenshotResult = await safe(() =>
        client.browserRendering.screenshot.create({
          account_id: env.CLOUDFLARE_ACCOUNT_ID,
          url,
          userAgent,
          screenshotOptions: screenshotOptionsWithEncoding,
          viewport,
          gotoOptions,
        }),
      );

      if (!screenshotResult.ok) {
        const errorMessage =
          screenshotResult.error instanceof Error
            ? screenshotResult.error.message
            : "Unknown error capturing screenshot";
        return {
          success: false,
          error: `Failed to capture screenshot: ${errorMessage}`,
        };
      }

      const response = screenshotResult.value;

      if (!response.errors?.length) {
        return {
          success: false,
          error:
            response.errors?.[0]?.message ??
            "Cloudflare API indicated failure while capturing screenshot.",
        };
      }
      if (!response.status) {
        return {
          success: false,
          error: "Cloudflare API did not return a status.",
        };
      }

      return {
        success: true,
      };
    },
  });

  return {
    screenshot_site: screenshot,
  } as const;
}

const TARGET_SITES = [
  { name: "Skool", slug: "skool", url: "https://skool.com" },
  { name: "Circle", slug: "circle", url: "https://circle.so/" },
] as const;

const GOOGLEBOT_USER_AGENT =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

type SiteDefinition = (typeof TARGET_SITES)[number];

async function main() {
  const env = apiEnv();
  const client = new Cloudflare({
    apiToken: env.CLOUDFLARE_BROWSER_RENDERING_API_TOKEN,
  });
  const envOutputDir = join(process.cwd(), "screenshots");
  mkdirSync(envOutputDir, { recursive: true });

  for (const site of TARGET_SITES) {
    console.log(`Capturing ${site.name}`);
    await captureSite({
      client,
      env,
      outputDir: envOutputDir,
      site,
    });
  }
}

async function captureSite({
  client,
  env,
  outputDir,
  site,
}: {
  client: Cloudflare;
  env: ReturnType<typeof apiEnv>;
  outputDir: string;
  site: SiteDefinition;
}) {
  const screenshotResult = await safe(() =>
    client.browserRendering.screenshot.create({
      account_id: env.CLOUDFLARE_ACCOUNT_ID,
      url: site.url,
      viewport: {
        width: 1300,
        height: 1200,
      },
      screenshotOptions: {
        type: "jpeg",
        quality: 100,
        encoding: "base64",
      },
      gotoOptions: {
        waitUntil: "networkidle2",
      },
      userAgent: GOOGLEBOT_USER_AGENT,
    }),
  );

  if (!screenshotResult.ok) {
    console.error(`Failed to capture ${site.url}`, screenshotResult.error);
    return;
  }

  const screenshotReference = extractScreenshotReference(
    screenshotResult.value,
  );
  if (!screenshotReference) {
    console.error("Could not determine screenshot payload for", site.url);
    return;
  }

  const buffer = await downloadPayload(screenshotReference);
  const croppedBuffer = await cropBottom(buffer, 400);
  const fileName = `20251219_${site.slug}.jpeg`;
  const outputPath = join(outputDir, fileName);
  writeFileSync(outputPath, croppedBuffer);
  console.log(`Wrote ${outputPath}`);
}

async function cropBottom(
  input: Buffer,
  removeHeight: number,
): Promise<Buffer> {
  // const Jimp = createJimp({
  //   formats: [...defaultFormats, webp],
  //   plugins: defaultPlugins,
  // });
  const image = await Jimp.read(input);
  const width = image.width;
  const height = image.height;
  const targetHeight = height - removeHeight;

  if (targetHeight <= 0) {
    return input;
  }

  image.crop({
    h: targetHeight,
    w: width,
    x: 0,
    y: 0,
  });
  const mime = image.mime;

  if (!mime) {
    return input;
  }

  return image.getBuffer("image/jpeg");
}

function extractScreenshotReference(payload: unknown): string | undefined {
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (trimmed.startsWith("http") || trimmed.startsWith("data:image")) {
      return trimmed;
    }
  }

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const result = extractScreenshotReference(entry);
      if (result) {
        return result;
      }
    }
  }

  if (payload && typeof payload === "object") {
    for (const value of Object.values(payload as Record<string, unknown>)) {
      const result = extractScreenshotReference(value);
      if (result) {
        return result;
      }
    }
  }

  return undefined;
}

async function downloadPayload(reference: string): Promise<Buffer> {
  if (reference.startsWith("data:image")) {
    const base64 = reference.split(",")[1];
    if (!base64) {
      throw new Error("Invalid data URI payload");
    }
    return Buffer.from(base64, "base64");
  }

  const response = await fetch(reference);
  if (!response.ok) {
    throw new Error(
      `Unable to download screenshot ${reference} (${response.status})`,
    );
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
