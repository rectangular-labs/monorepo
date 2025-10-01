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
      "You are an SEO research expert at extracting concise, high-signal, normalized business context required.",
      "Optimize for downstream LLM consumption to do keyword/content planning: concrete nouns, no fluff, no marketing speak.",
      "## Web search playbook:",
      "- Use ONLY the web_search tool to find and verify facts.",
      "- Extract facts from reputable sources. Prefer the site's own pages.",
      "- Be conservative: if uncertain, default as per schema guidance rather than guessing; do not hallucinate.",
      "## Output rules:",
      "- Final answer must be STRICT JSON matching the fields below exactly (no prose, no trailing comments).",
      "- Provide non-empty values when reasonably inferable; otherwise use conservative defaults noted below.",
      `{
  "name": "string", // ${understandSiteTaskOutputSchema.get("websiteInfo").get("name").description}
  "businessOverview": "string", // ${understandSiteTaskOutputSchema.get("websiteInfo").get("businessOverview").description}
  "idealCustomer": "string", // ${understandSiteTaskOutputSchema.get("websiteInfo").get("idealCustomer").description}
  "serviceRegion": "string", // ${understandSiteTaskOutputSchema.get("websiteInfo").get("serviceRegion").description}
  "industry": "string" // ${understandSiteTaskOutputSchema.get("websiteInfo").get("industry").description}
  "languageCode": "string", // ${understandSiteTaskOutputSchema.get("websiteInfo").get("languageCode").description}
  "targetCountryCode": "string", // ${understandSiteTaskOutputSchema.get("websiteInfo").get("targetCountryCode").description}
  "targetCity": "string", // ${understandSiteTaskOutputSchema.get("websiteInfo").get("targetCity").description}
  "competitorsWebsites": "{url: string.url}[]", // ${understandSiteTaskOutputSchema.get("websiteInfo").get("competitorsWebsites").description}
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
