import { task } from "@trigger.dev/sdk/v3";
import { crawlSite } from "../crawlers/site.js";
import type { SiteCrawlInputSchema } from "../schema/site.js";

export const siteCrawlTask = task({
  id: "site-crawl",
  maxDuration: 300,
  run: async (payload: typeof SiteCrawlInputSchema.infer) => {
    await crawlSite(payload);

    return {
      message: "Hello, world!",
    };
  },
});
