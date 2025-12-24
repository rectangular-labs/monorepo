import { err, ok, type Result, safe } from "@rectangular-labs/result";
import Cloudflare from "cloudflare";
import { apiEnv } from "../../env";

export async function fetchPageContent(args: {
  url: string;
  userAgent?: string;
}): Promise<Result<{ markdown: string; url: string }, Error>> {
  const env = apiEnv();
  const client = new Cloudflare({
    apiToken: env.CLOUDFLARE_BROWSER_RENDERING_API_TOKEN,
  });
  const markdownResult = await safe(() =>
    client.browserRendering.markdown.create({
      account_id: env.CLOUDFLARE_ACCOUNT_ID,
      userAgent: args.userAgent,
      url: args.url,
    }),
  );
  if (!markdownResult.ok) {
    return err(
      new Error(`Failed to fetch URL: ${markdownResult.error.message}`),
    );
  }

  return ok({
    markdown: markdownResult.value,
    url: args.url,
  });
}
