import { safe } from "@rectangular-labs/result";
import { generateObject, jsonSchema, tool } from "ai";
import { goodsServicesModel } from "./models";

// --- MOCK DATA --- (Replace with actual data source: API, DB, etc.)
const mockPreapprovedGoodsServices = {
  // Class 3: Cosmetics, cleaning
  3: [
    "Bleaching preparations for laundry use",
    "Cleaning preparations",
    "Polishing preparations",
    "Abrasive preparations",
    "Soaps",
    "Perfumery",
    "Essential oils",
    "Non-medicated cosmetics",
    "Non-medicated hair lotions",
    "Non-medicated dentifrices",
  ],
  // Class 9: Scientific, tech, software
  9: [
    "Computers",
    "Computer software, recorded",
    "Computer peripheral devices",
    "Downloadable computer software applications",
    "Data processing apparatus",
    "Measuring apparatus",
    "Signalling apparatus",
    "Optical apparatus and instruments",
    "Audiovisual apparatus",
  ],
  // Class 35: Advertising, business
  35: [
    "Advertising services",
    "Business management assistance",
    "Business administration services",
    "Providing office functions",
    "Online advertising on a computer network",
    "Sales promotion for others",
    "Marketing services",
    "Data search in computer files for others",
  ],
  // Add more mock classes/services as needed
};
// --- END MOCK DATA ---

export const relevantGoodsServices = tool({
  description:
    "Suggests relevant goods and services from the Singapore pre-approved list based on provided NICE classifications and business background.",
  parameters: jsonSchema<{
    classifications: {
      class: number;
      reasoning: string;
    }[];
    backgroundInfo: string;
  }>({
    type: "object",
    properties: {
      classifications: {
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
      backgroundInfo: { type: "string" },
    },
    required: ["classifications", "backgroundInfo"],
  }),
  execute: async ({ classifications, backgroundInfo }, { messages }) => {
    console.log("Executing relevantGoodsServices tool...");
    console.log("Classifications:", classifications);
    console.log("messages", messages);

    if (!classifications || classifications.length === 0) {
      console.log("No classifications provided.");
      return { relevantServices: [] };
    }

    // Prepare the relevant mock data based on input classes
    let relevantMockDataPromptSection =
      "Relevant Preapproved Goods/Services (Examples):\n";
    let foundData = false;
    for (const { class: classNum } of classifications) {
      const services =
        mockPreapprovedGoodsServices[
          classNum as keyof typeof mockPreapprovedGoodsServices
        ];
      if (services) {
        relevantMockDataPromptSection += `Class ${classNum}:\n - ${services.join("\n - ")}\n`;
        foundData = true;
      }
    }

    if (!foundData) {
      relevantMockDataPromptSection +=
        "No specific examples found for the provided class(es) in the current list.";
    }

    // Add type annotation for map callback parameter
    const classificationsText = classifications
      .map(
        (c: { class: number; reasoning: string }) =>
          `- Class ${c.class}: ${c.reasoning}`,
      )
      .join("\n");

    const result = await safe(() =>
      generateObject({
        model: goodsServicesModel,
        schema: jsonSchema<{
          relevantServices: string[];
        }>({
          type: "object",
          properties: {
            relevantServices: { type: "array", items: { type: "string" } },
          },
          required: ["relevantServices"],
        }),
        prompt: `Based on the following business background information, the suggested NICE classifications, and the provided examples from the Singapore preapproved list, identify and list the *most relevant* specific goods and services that should be included in a trademark application. 

        Business Background:
        --- Start Background ---
        ${backgroundInfo}
        --- End Background ---

        Suggested NICE Classifications:
        ${classificationsText}
        
        ${relevantMockDataPromptSection}

        Instructions:
        - Focus on specificity. Select items directly from the provided examples if they fit the background.
        - If the examples are insufficient but the background suggests other standard items for the class, you may infer *very common* ones (e.g., 'computer software' for Class 9 if background is software development).
        - Do NOT invent niche or overly specific items not commonly found on preapproved lists.
        - Aim for a concise list of the *most* applicable items.
        - Return ONLY the JSON object matching the schema with the list of strings.
        - If no relevant services can be determined, return an empty array.
        `,
        mode: "json",
      }),
    );
    if (!result.ok) {
      console.error(
        "Error executing relevantGoodsServices tool:",
        result.error,
      );
      return { relevantServices: [] };
    }
    const { object } = result.value;
    console.log("relevantGoodsServices tool result:", object);
    return object;
  },
});
