import { anthropic } from "@ai-sdk/anthropic";
import { updateContentCampaign } from "@rectangular-labs/db/operations";
import { convertToModelMessages, generateText } from "ai";
import { getWebsocketContext } from "../../context";
import type { SeoChatMessage } from "../../types";

export async function handleTitleGeneration(message: SeoChatMessage) {
  const context = getWebsocketContext();

  const updatedTitle = await generateText({
    model: anthropic("claude-haiku-4-5"),
    system:
      "Based on the user's message extract out the main topic and generate a concise and succinct title for this campaign. JUST RETURN WITH A TITLE AND NOTHING ELSE. The title should be no more than 10 words.",
    messages: convertToModelMessages([
      message,
      {
        role: "user",
        parts: [
          {
            type: "text",
            text: `The above is my initial question/task for my site ${context.cache.project?.name}. Use that to generate a title for this campaign`,
          },
        ],
      },
    ]),
  });
  const finalTitle = updatedTitle.text.split(" ").slice(0, 10).join(" ");
  await updateContentCampaign({
    db: context.db,
    values: {
      id: context.campaignId,
      projectId: context.projectId,
      organizationId: context.organizationId,
      title: finalTitle,
    },
  });
  context.updateCampaignTitle(finalTitle);
  const senderAttachment = context.senderWebSocket.deserializeAttachment();
  context.senderWebSocket.serializeAttachment({
    ...senderAttachment,
    campaignTitle: finalTitle,
  });
}
