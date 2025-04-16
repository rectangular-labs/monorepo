import { google } from "@ai-sdk/google";
import { safe } from "@rectangular-labs/result";
import { jsonSchema, tool } from "ai";
import { generateText } from "ai";

export const backgroundResearch = tool({
  description:
    "Conducts background research on a specified business using Google search grounding to get current information.",
  // Use jsonSchema helper with ArkType
  parameters: jsonSchema<{
    businessName: string;
  }>({
    type: "object",
    properties: {
      businessName: {
        type: "string",
      },
    },
    required: ["businessName"],
  }),
  execute: async ({ businessName }) => {
    console.log(`Conducting background research for: ${businessName}`);
    const result = await safe(() =>
      generateText({
        model: google("gemini-2.5-pro-preview-03-25", {
          // Enable search grounding
          useSearchGrounding: true,
        }),
        prompt: `Provide a concise background summary of the business "${businessName}", focusing on its core activities, market presence, and any notable recent developments relevant to trademark considerations. Use search grounding to ensure information is current.`,
      }),
    );
    if (!result.ok) {
      console.error(
        "Error performing background research for ${businessName}:",
        result.error,
      );
      return `An error occurred while researching ${businessName}. Please try again later or proceed without this specific background information.`;
    }
    const { text, finishReason, usage, providerMetadata } = result.value;

    console.log(
      `Background research for ${businessName} finished. Reason: ${finishReason}, Usage: ${JSON.stringify(
        usage,
      )}`,
    );
    // Log grounding metadata if available (optional)
    const googleMeta = providerMetadata?.google;
    console.log("googleMeta", googleMeta);
    if (googleMeta?.groundingMetadata) {
      console.log(
        "Grounding Metadata:",
        (
          googleMeta.groundingMetadata as unknown as {
            groundingChunks: string[];
            groundingSupports: string[];
          }
        ).groundingChunks,
      );
      console.log(
        "Grounding Metadata:",
        (
          googleMeta.groundingMetadata as unknown as {
            groundingSupports: string[];
          }
        ).groundingSupports,
      );
    }

    // Return the research summary text
    return { businessBackgroundInfo: text };
  },
});
