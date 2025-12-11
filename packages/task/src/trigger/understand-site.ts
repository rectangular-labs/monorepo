import { google } from "@ai-sdk/google";
import { create, insertMultiple } from "@orama/orama";
import {
  businessBackgroundSchema,
  understandSiteTaskInputSchema,
  type understandSiteTaskOutputSchema,
} from "@rectangular-labs/db/parsers";
import { schemaTask } from "@trigger.dev/sdk";
import { generateText, stepCountIs } from "ai";
import { type } from "arktype";
import { crawlSite } from "../crawlers/site.js";
import { createGetSitesDataTool } from "../lib/ai-tools/get-site-data.js";
import { llmParseJson } from "../lib/ai-tools/llm-parse-json.js";
import { createSearchSitesTool } from "../lib/ai-tools/search-site.js";
import { siteSchema } from "../lib/orama/site-schema.js";
import { setTaskMetadata } from "../lib/task-metadata.js";

const inputSchema = understandSiteTaskInputSchema.merge(
  type({ maxRequestsPerCrawl: "1<=number<=50 = 25" }),
);
export const understandSiteTask: ReturnType<
  typeof schemaTask<
    "understand-site",
    typeof inputSchema,
    typeof understandSiteTaskOutputSchema.infer
  >
> = schemaTask({
  id: "understand-site",
  maxDuration: 300,
  machine: "small-1x",
  schema: inputSchema,
  run: async (payload) => {
    setTaskMetadata({
      progress: 0,
      statusMessage: `Loading up ${payload.websiteUrl}...`,
    });
    const result = await crawlSite({
      startUrl: payload.websiteUrl,
      maxRequestsPerCrawl: payload.maxRequestsPerCrawl,
      crawlSitemap: false,
      onProgress: (args) => {
        const progress = Math.round(
          ((args.succeeded + args.failed + args.inFlight) /
            (payload.maxRequestsPerCrawl * 2)) * // we set the crawl to be at most half the progress of the whole understanding process
            100,
        );
        setTaskMetadata({
          progress,
          statusMessage: args.currentUrl
            ? `Currently understanding ${args.currentUrl}...`
            : `${progress}% done, hang tight...`,
        });
      },
    });

    setTaskMetadata({
      progress: 50,
      statusMessage:
        "Finished reading through the site. Extracting relevant information...",
    });

    // construct search index and insert in batches of 500
    const db = create({
      schema: siteSchema,
    });
    const LIMIT = 500;
    let offset = 0;
    let data = await result.getData({
      offset,
      limit: LIMIT,
    });
    const ids: string[] = [];
    while (data.count > 0) {
      const newIds = await insertMultiple(db, data.items, LIMIT);

      ids.push(...newIds);
      offset += LIMIT;
      data = await result.getData({
        offset,
        limit: LIMIT,
      });
    }

    setTaskMetadata({
      progress: 75,
      statusMessage: "Found relevant information, synthesizing the results...",
    });

    // Define structured output schema to match seoWebsiteInfoSchema
    const StructuredSeoSchema = type({
      name: type.string.describe("The name of the site."),
    })
      .merge(businessBackgroundSchema)
      .describe("Normalized business context for downstream SEO planning.");

    // Guide the model to use tools to ground the output
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      temperature: 0,
      system: [
        "You are an SEO strategy expert at extracting concise, high-signal, normalized business context.",
        "Optimize for downstream LLM keyword/content planning: concrete nouns, no fluff, no marketing speak.",
        "## Research policy:",
        "- Prioritize authoritative sources like About, Product/Service, Pricing, Contact, Case Studies, Blog, Testimonials.",
        "- Use `search-sites` tool to find these pages; for top hits, call the `get-sites-data` tool to get the full content for relevant pages to ground your statements.",
        "- If specifics are missing, make sure you search the site thoroughly. If things are still missing infer conservatively from the various search results; do not hallucinate.",
        "- Determine whether the site serves businesses (B2B), consumers (B2C), or both; format idealCustomer accordingly.",
        "## Output rules:",
        "Final answer must be STRICT JSON matching the schema below exactly (no prose).",
        `{
    "name": "string", // The name of the site.
    "businessOverview": "string", // Start with org type + primary offering(s); state ALL the business Unique Value Proposition comprehensively; no fluff
    "idealCustomer": "string", // B2B: Roles/Titles; Industries; Company size; Geo. B2C: Personas; Demographics/Age; Needs/Use cases; Geo. If both, separate with ' | '. Examples — B2B: 'Ops leaders; SaaS; 50-500 FTE; US/UK'; B2C: 'Parents of toddlers; 25-40; Childcare savings; US'
    "serviceRegion": "string", // Global OR 'US; UK' OR regions like 'EU', 'Asia', 'Africa', OR local 'City, ST; City, ST'
    "industry": "string" // Broad top-level category, e.g. 'Software', 'Healthcare', 'E-commerce'
}`,
        "",
        "DO NOT ASK FOR MORE INFORMATION. Start planning deeply for 30 minutes right away and use the appropriate tools to get the information. A great response will help a lot of people and could save the business from going under. Good work will be thoroughly rewarded.",
      ].join(" \n"),
      tools: {
        "search-sites": createSearchSitesTool(db),
        "get-sites-data": createGetSitesDataTool(db),
      },
      prompt: `I've extracted information from ${payload.websiteUrl} to inform SEO keyword and content planning. Use the tools to research and return ONLY the normalized JSON.`,
      onStepFinish: (step) => {
        console.log("Step content", step.text);
        console.log(
          "Step tool calls",
          step.toolResults.map((tool) => JSON.stringify(tool)),
        );
      },
      stopWhen: stepCountIs(15),
    }).catch((error) => {
      console.error("Error in understandSiteTask", error);
      throw error;
    });
    const websiteInfo = await llmParseJson(text, StructuredSeoSchema);

    setTaskMetadata({
      progress: 100,
      statusMessage: "All done, ready to continue!",
    });

    return {
      type: "understand-site",
      websiteInfo: {
        ...websiteInfo,
        version: "v1",
      },
    };
  },
});
