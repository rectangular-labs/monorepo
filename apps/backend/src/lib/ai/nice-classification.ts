import { safe } from "@rectangular-labs/result";
import { generateObject, jsonSchema, tool } from "ai";
import { niceClassificationModel } from "./models";
import { niceClassificationData } from "./nice-classification.data";

// Format the NICE data for inclusion in the prompt
const niceDataPromptSection = niceClassificationData
  .map((item) => `Class ${item.class}: ${item.description}`)
  .join("\n");

export const niceClassification = tool({
  description:
    "Classifies a business activity based on background information according to the official NICE classification system. Provides relevant class numbers and reasoning.",
  parameters: jsonSchema<{
    backgroundInfo: string;
  }>({
    type: "object",
    properties: {
      backgroundInfo: {
        type: "string",
      },
    },
    required: ["backgroundInfo"],
  }),
  execute: async ({ backgroundInfo }) => {
    console.log(
      `Executing niceClassification tool with background: ${backgroundInfo.substring(0, 100)}...`,
    );
    const result = await safe(() =>
      generateObject({
        model: niceClassificationModel, // Use the dedicated model
        schema: jsonSchema<{
          classification: {
            class: number;
            reasoning: string;
          }[];
        }>({
          type: "object",
          properties: {
            classification: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  class: { type: "number" },
                  reasoning: { type: "string" },
                },
                required: ["class", "reasoning"],
              },
            },
          },
          required: ["classification"],
        }),
        prompt: `Analyze the following business background information and determine the most relevant NICE classification(s).
        
        Background Information:
        --- Start Background --- 
        ${backgroundInfo}
        --- End Background ---

        Reference NICE Classification List:
        --- Start NICE List ---
        ${niceDataPromptSection}
        --- End NICE List ---

        Respond ONLY with the JSON object matching the requested schema, providing the class number and your reasoning for each relevant classification based *only* on the provided background information and the NICE list.
        If multiple classes seem relevant, include them all.
        If no classes seem relevant or the information is insufficient, return an empty array for 'classification'.`,
        mode: "json",
      }),
    );
    if (!result.ok) {
      console.error("Error executing niceClassification tool:", result.error);
      return { classification: [] };
    }
    const { object } = result.value;
    console.log("niceClassification tool result:", object);
    return object; // Return the structured data
  },
});
