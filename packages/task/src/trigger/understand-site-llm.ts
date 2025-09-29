import { openai } from "@ai-sdk/openai";
import {
  understandSiteTaskInputSchema,
  understandSiteTaskOutputSchema,
} from "@rectangular-labs/db/parsers";
import { schemaTask } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { llmParseJson } from "../lib/ai-tools/llm-parse-json.js";
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

    const system = [
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
  "name": "string", // ${understandSiteTaskOutputSchema.get("websiteInfo").get("name").description}
  "businessOverview": "string", // ${understandSiteTaskOutputSchema.get("websiteInfo").get("businessOverview").description}
  "idealCustomer": "string", // ${understandSiteTaskOutputSchema.get("websiteInfo").get("idealCustomer").description}
  "serviceRegion": "string", // ${understandSiteTaskOutputSchema.get("websiteInfo").get("serviceRegion").description}
  "industry": "string" // ${understandSiteTaskOutputSchema.get("websiteInfo").get("industry").description}
  "languageCode": "string", // ${understandSiteTaskOutputSchema.get("websiteInfo").get("languageCode").description}
  "targetCountryCode": "string", // ${understandSiteTaskOutputSchema.get("websiteInfo").get("targetCountryCode").description}
  "targetCity": "string", // ${understandSiteTaskOutputSchema.get("websiteInfo").get("targetCity").description}
}`,
      "",
      "DO NOT ASK FOR MORE INFORMATION. Start planning deeply for 30 minutes right away and use the appropriate tools to get the information. A great response will help a lot of people and could save the business from going under. Good work will be thoroughly rewarded.",
    ].join(" \n");

    const { text } = await generateText({
      model: openai("gpt-5-mini"),
      tools: {
        web_search: openai.tools.webSearch({
          searchContextSize: "high",
        }),
      },
      system,
      messages: [
        {
          role: "user",
          content: `Extract the required information from the website: ${payload.websiteUrl}`,
        },
      ],
      onStepFinish: (step) => {
        console.log("Step content", step.text);
        console.log(
          "Step tool calls",
          step.toolResults.map((tool) => JSON.stringify(tool)),
        );
      },
    });
    console.log("text", text);

    const object = await llmParseJson(
      text,
      understandSiteTaskOutputSchema.get("websiteInfo").omit("version"),
    );

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
