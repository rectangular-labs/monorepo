import { openai } from "@ai-sdk/openai";
import {
  understandSiteTaskInputSchema,
  understandSiteTaskOutputSchema,
} from "@rectangular-labs/db/parsers";
import { schemaTask } from "@trigger.dev/sdk";
import { generateObject, type JSONSchema7, jsonSchema } from "ai";
import { setTaskMetadata } from "../lib/task-metadata.js";

export const understandSiteLlmTask: ReturnType<
  typeof schemaTask<
    "understand-site-llm",
    typeof understandSiteTaskInputSchema,
    typeof understandSiteTaskOutputSchema.infer
  >
> = schemaTask({
  id: "understand-site-llm",
  maxDuration: 300,
  machine: "micro",
  schema: understandSiteTaskInputSchema,
  run: async (payload) => {
    setTaskMetadata({
      progress: 0,
      statusMessage: `Loading up ${payload.websiteUrl}...`,
    });
    let progress = 10;
    setInterval(() => {
      const loaderMessage = [
        `Understanding ${payload.websiteUrl}...`,
        "Looking for relevant information...",
        "Digging deeper...",
        "Finding the right information...",
        "Getting the full picture...",
      ];
      setTaskMetadata({
        progress,
        statusMessage: loaderMessage[Math.floor(progress / 5)] ?? "",
      });
      progress += 5;
    }, 3000);

    const { object } = await generateObject({
      model: openai("gpt-5-mini"),
      schema: jsonSchema<
        Omit<
          (typeof understandSiteTaskOutputSchema.infer)["websiteInfo"],
          "version"
        >
      >(
        understandSiteTaskOutputSchema
          .get("websiteInfo")
          .omit("version")
          .toJsonSchema() as JSONSchema7,
      ),
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
      messages: [
        {
          role: "user",
          content: `Extract the required information from the website: ${payload.websiteUrl}`,
        },
      ],
    });

    setTaskMetadata({
      progress: 100,
      statusMessage: "All done, ready to continue!",
    });

    return {
      type: "understand-site",
      websiteInfo: {
        ...object,
        version: "v1",
      },
    };
  },
});
