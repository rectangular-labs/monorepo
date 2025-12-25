import { Buffer } from "node:buffer";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { safe } from "@rectangular-labs/result";
import Cloudflare from "cloudflare";
import { Jimp } from "jimp";
import { apiEnv } from "../../../env";

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
  const screenshotResult = await safe(async () => {
    const response = await client.browserRendering.screenshot
      .create({
        account_id: env.CLOUDFLARE_ACCOUNT_ID,
        url: site.url,
        viewport: {
          width: 1300,
          height: 1200,
        },
        screenshotOptions: {
          type: "jpeg",
          quality: 100,
          encoding: "binary",
        },
        gotoOptions: {
          waitUntil: "networkidle2",
        },
        userAgent: GOOGLEBOT_USER_AGENT,
      })
      .asResponse();

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Cloudflare screenshot request failed (${response.status}): ${text || response.statusText}`,
      );
    }

    const contentType = response.headers.get("content-type")?.toLowerCase();
    if (contentType?.includes("application/json")) {
      const json = (await response.json().catch(() => undefined)) as unknown;
      throw new Error(
        `Unexpected JSON response from Cloudflare screenshot endpoint: ${JSON.stringify(json)}`,
      );
    }

    const bytes = await response.arrayBuffer();
    return Buffer.from(bytes);
  });

  if (!screenshotResult.ok) {
    console.error(`Failed to capture ${site.url}`, screenshotResult.error);
    return;
  }

  const croppedBuffer = await cropBottom(screenshotResult.value, 400);
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

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
