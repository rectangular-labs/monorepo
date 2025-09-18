import { schemaTask } from "@trigger.dev/sdk";
import { type } from "arktype";
import { crawlSite } from "../crawlers/site.js";

const inputSchema = type({
  startUrl: "string",
  maxRequestsPerCrawl: "number=20",
});
export const understandSiteTask: ReturnType<
  typeof schemaTask<"understand-site", typeof inputSchema>
> = schemaTask({
  id: "understand-site",
  maxDuration: 300,
  schema: inputSchema,
  run: async (payload) => {
    const result = await crawlSite({
      startUrl: payload.startUrl,
      maxRequestsPerCrawl: payload.maxRequestsPerCrawl,
    });

    const data = await result.getData();
    for (const item of data.items) {
      console.log(item);
    }
    // TODO: use ai and extract relevant information from the result
    return {
      message: "Site crawled successfully",
    };
  },
});
