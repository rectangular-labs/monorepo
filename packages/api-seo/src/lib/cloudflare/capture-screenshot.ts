import { Buffer } from "node:buffer";
import { ok, type Result, safe } from "@rectangular-labs/result";
import Cloudflare from "cloudflare";
import { Jimp } from "jimp";
import { apiEnv } from "../../env";

const OPENAI_GPTBOT_USER_AGENT =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.0; +https://openai.com/gptbot";

export async function captureScreenshot(args: {
  url: string;
  viewport: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
  };
  cropBottom?: number;
}): Promise<Result<{ buffer: Buffer; url: string }, Error>> {
  const env = apiEnv();
  const client = new Cloudflare({
    apiToken: env.CLOUDFLARE_BROWSER_RENDERING_API_TOKEN,
  });

  const screenshotResult = await safe(async () => {
    const response = await client.browserRendering.screenshot
      .create({
        account_id: env.CLOUDFLARE_ACCOUNT_ID,
        url: args.url,
        viewport: args.viewport,
        screenshotOptions: {
          type: "jpeg",
          quality: 100,
          encoding: "binary",
        },
        gotoOptions: {
          waitUntil: "networkidle0",
        },
        userAgent: OPENAI_GPTBOT_USER_AGENT,
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
    return screenshotResult;
  }

  const buffer = screenshotResult.value;
  const finalBuffer =
    args.cropBottom !== undefined && args.cropBottom > 0
      ? await cropBottom(buffer, args.cropBottom)
      : buffer;

  return ok({
    buffer: finalBuffer,
    url: args.url,
  });
}

async function cropBottom(
  input: Buffer,
  removeHeight: number,
): Promise<Buffer> {
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

  return image.getBuffer("image/jpeg");
}
