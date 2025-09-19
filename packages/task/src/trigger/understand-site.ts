import { schemaTask } from "@trigger.dev/sdk";
import { type } from "arktype";
import { crawlSite } from "../crawlers/site.js";
import { setUnderstandSiteMetadata } from "./understand-site.metadata.js";

const inputSchema = type({
  startUrl: "string",
  maxRequestsPerCrawl: "number=25",
});

export const understandSiteTask: ReturnType<
  typeof schemaTask<"understand-site", typeof inputSchema>
> = schemaTask({
  id: "understand-site",
  maxDuration: 300,
  schema: inputSchema,
  run: async (payload) => {
    setUnderstandSiteMetadata({
      progress: 0,
      statusMessage: `Loading up ${payload.startUrl}...`,
    });
    const result = await crawlSite({
      startUrl: payload.startUrl,
      maxRequestsPerCrawl: payload.maxRequestsPerCrawl,
      crawlSitemap: false,
      onProgress: (args) => {
        const progress = Math.round(
          ((args.succeeded + args.failed + args.inFlight) /
            (payload.maxRequestsPerCrawl * 2)) *
            100,
        );
        setUnderstandSiteMetadata({
          progress,
          statusMessage: args.currentUrl
            ? `Currently understanding ${args.currentUrl}...`
            : `${progress}% done, hang tight...`,
        });
      },
    });

    setUnderstandSiteMetadata({
      progress: 50,
      statusMessage:
        "Finished reading through the site. Extracting relevant information...",
    });

    const data = await result.getData();
    for (const item of data.items) {
      console.log(item);
    }
    // TODO: construct search index
    setUnderstandSiteMetadata({
      progress: 60,
      statusMessage: "Found relevant information, synthesizing the results...",
    });

    // TODO: upload search index
    setUnderstandSiteMetadata({
      progress: 75,
      statusMessage: "Almost done!",
    });

    // TODO: use ai and extract relevant information from the result
    setUnderstandSiteMetadata({
      progress: 100,
      statusMessage: "All done, loading the results...",
    });

    return {
      message: "Site crawled successfully",
    };
  },
});
