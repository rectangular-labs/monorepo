import { google } from "@ai-sdk/google";
import type { DB } from "@rectangular-labs/db";
import { updateChat } from "@rectangular-labs/db/operations";
import { convertToModelMessages, generateText } from "ai";
import type { SeoChatMessage } from "../../types";

export async function handleTitleGeneration({
  message,
  db,
  chatId,
  projectId,
  projectName,
  organizationId,
}: {
  message: SeoChatMessage;
  db: DB;
  chatId: string;
  projectId: string;
  projectName: string;
  organizationId: string;
}) {
  const updatedTitle = await generateText({
    model: google("gemini-3-flash-preview"),
    system:
      "Based on the user's message extract out the main topic and generate a concise and succinct title for this chat. JUST RETURN WITH A TITLE AND NOTHING ELSE. The title should be no more than 10 words.",
    messages: await convertToModelMessages([
      message,
      {
        role: "user",
        parts: [
          {
            type: "text",
            text: `The above is my initial question/task for my site ${projectName}. Use that to generate a title for this chat`,
          },
        ],
      },
    ]),
  });
  const finalTitle = updatedTitle.text.split(" ").slice(0, 10).join(" ");
  await updateChat({
    db,
    values: {
      id: chatId,
      projectId,
      organizationId,
      title: finalTitle,
    },
  });
}
