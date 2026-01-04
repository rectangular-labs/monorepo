import { ok, type Result, safe } from "@rectangular-labs/result";
import { apiEnv } from "../../../env";

export async function captureScreenshotOne(args: {
  url: string;
  viewport: { width: number; height: number };
  fullPage?: boolean;
}): Promise<
  Result<{ bytes: Uint8Array; contentType: string; url: string }, Error>
> {
  const env = apiEnv();

  const result = await safe(async () => {
    const endpoint = new URL("https://api.screenshotone.com/take");
    endpoint.searchParams.set("access_key", env.SCREENSHOTONE_API_KEY);
    endpoint.searchParams.set("url", args.url);
    endpoint.searchParams.set("response_type", "by_format");
    endpoint.searchParams.set("format", "webp");
    endpoint.searchParams.set("viewport_width", String(args.viewport.width));
    endpoint.searchParams.set("viewport_height", String(args.viewport.height));

    endpoint.searchParams.set("block_cookie_banners", "true");
    endpoint.searchParams.set("block_banners_by_heuristics", "true");
    endpoint.searchParams.set("block_ads", "true");
    endpoint.searchParams.set("block_trackers", "true");
    endpoint.searchParams.set("block_chats", "true");
    endpoint.searchParams.set("reduced_motion", "true");

    endpoint.searchParams.append("wait_until", "networkidle2");
    endpoint.searchParams.set("delay", "0");
    endpoint.searchParams.set("timeout", "60");

    if (args.fullPage) {
      endpoint.searchParams.set("full_page", "true");
      endpoint.searchParams.set("full_page_scroll", "true");
      endpoint.searchParams.set("full_page_max_height", "8000");
    }

    const response = await fetch(endpoint).catch((error) => {
      throw error instanceof Error ? error : new Error(String(error));
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `ScreenshotOne request failed (${response.status}): ${text || response.statusText}`,
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const bytes = new Uint8Array(await response.arrayBuffer());
    return { bytes, contentType, url: args.url };
  });

  if (!result.ok) return result;
  return ok(result.value);
}
