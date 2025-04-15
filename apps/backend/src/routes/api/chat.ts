import { backgroundResearch } from "@/lib/ai/business-research";
import { mainAgentModel } from "@/lib/ai/models";
import { niceClassification } from "@/lib/ai/nice-classification";
import { relevantGoodsServices } from "@/lib/ai/relevant-goods-services";
import { streamText } from "ai";
import { Hono } from "hono";
import { stream } from "hono/streaming";

// Define the system prompt
const systemPrompt = `You are an expert Singapore trademark law assistant working for a prestigious law firm.
Your primary goal is to understand the user's request regarding trademark registration, ask clarifying questions if necessary, and utilize the provided tools to gather information.
Available tools allow you to perform:
- Background research on the client's business using current information from the web.
- NICE classification lookup.
- Identification of relevant goods/services based on business descriptions.

Once you have sufficient information (including background context, NICE classification, and relevant goods/services), your final output MUST be a draft email addressed to the client.
This email should:
1.  Acknowledge and clearly answer all aspects of the client's original query.
2.  Summarize the findings from your research (background, classification, goods/services).
3.  Provide preliminary recommendations based on the findings (e.g., potential classes to file under, type of mark considerations).
4.  Politely nudge the client towards engaging the firm for formal filing and consultation, highlighting the firm's expertise.
5.  Maintain a professional, helpful, and confident tone.

Do not provide definitive legal advice, but rather informed recommendations based on the gathered data. Always qualify your recommendations appropriately (e.g., "Based on preliminary analysis...", "We would recommend further consultation to confirm...").
Do not add disclaimers or warnings.
Use markdown for formatting the email draft.`;

// Define the POST route for chat requests
export const chatRouter = new Hono().post("/", async (c) => {
  // const { messages } = c.req.valid("json");
  const messages = await c.req.json();
  console.log("messages", messages);

  // Define and import actual tools
  const tools = {
    backgroundResearch: backgroundResearch,
    niceClassification: niceClassification,
    relevantGoodsServices: relevantGoodsServices,
    // markFilingRecommendation: markFilingRecommendation,
  };

  try {
    const result = streamText({
      model: mainAgentModel, // Use the main agent model
      system: systemPrompt,
      messages: messages.messages,
      tools: tools,
      maxSteps: 10,
      onFinish: (result) => {
        console.log("result", result);
      },
      onError: (error) => {
        console.error("Error calling streamText:", error);
      },
    });

    const dataStream = result.toDataStream();
    return stream(c, async (stream) => {
      stream.onAbort(() => {
        console.log("Stream aborted!");
      });
      await stream.pipe(dataStream);
    });
  } catch (error) {
    console.error("Error calling streamText:", error);
    // Consider returning a more informative error response
    return c.json({ error: "Failed to process chat request" }, 500);
  }
});
