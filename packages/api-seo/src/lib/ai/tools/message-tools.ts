import {
  getContentCampaignMessageById,
  listContentCampaignMessages,
} from "@rectangular-labs/db/operations";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import { getWebsocketContext } from "../../../context";
import type { AgentToolDefinition } from "./tool-definition";

function extractTextFromMessageParts(parts: unknown): string {
  if (!Array.isArray(parts)) {
    return "";
  }

  const textSegments: string[] = [];
  for (const part of parts) {
    if (
      part &&
      typeof part === "object" &&
      "type" in part &&
      part.type === "text" &&
      "text" in part &&
      typeof part.text === "string"
    ) {
      const text = part.text.trim();
      if (text) {
        textSegments.push(text);
      }
    }
  }

  return textSegments.join("\n");
}

function includesAskQuestionToolCall(parts: unknown): boolean {
  if (!Array.isArray(parts)) {
    return false;
  }

  for (const part of parts) {
    if (!part || typeof part !== "object") {
      continue;
    }
    if (!("type" in part) || part.type !== "tool-call") {
      continue;
    }

    if ("toolName" in part && part.toolName === "ask_question") {
      return true;
    }
    if ("tool" in part && part.tool === "ask_question") {
      return true;
    }
    if ("name" in part && part.name === "ask_question") {
      return true;
    }
  }

  return false;
}

const getHistoricalMessagesInputSchema = type({
  "cursor?": type("string").describe(
    "The message ID to use as a cursor from which message will be fetches from.",
  ),
  turns: type("number")
    .describe(
      "How many user turns to fetch before the cursor (each turn starts with a user message).",
    )
    .default(2),
});

const getDetailedMessageInputSchema = type({
  id: "string",
});

export function createMessagesToolsWithMetadata() {
  const getHistoricalMessages = tool({
    description:
      "Fetch historical chat turns (user messages and the assistant responses that followed) before a cursor message id.",
    inputSchema: jsonSchema<typeof getHistoricalMessagesInputSchema.infer>(
      getHistoricalMessagesInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ cursor, turns }) {
      const context = getWebsocketContext();

      const messagesResult = await listContentCampaignMessages({
        db: context.db,
        organizationId: context.organizationId,
        projectId: context.projectId,
        campaignId: context.campaignId,
        limit: Math.max(0, Math.floor(turns)) * 2, // to include the assistant message
        cursor,
      });
      if (!messagesResult.ok) {
        return {
          success: false,
          message: messagesResult.error.message,
        };
      }

      const messages = messagesResult.value.data.reverse();
      const transcriptLines: string[] = [];

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (!message) {
          throw new Error("BAD STATE: This should never happen.");
        }
        if (message.source === "user") {
          transcriptLines.push(`time: ${message.createdAt.toISOString()}`);
          transcriptLines.push(
            `user (${message.id}): ${extractTextFromMessageParts(message.message)}`,
          );

          // Check if the next message is from the assistant
          if (i + 1 < messages.length) {
            const nextMessage = messages[i + 1];
            if (!nextMessage) {
              throw new Error("BAD STATE: This should never happen.");
            }
            if (nextMessage.source === "assistant") {
              const assistantSummary = includesAskQuestionToolCall(
                nextMessage.message,
              )
                ? "asked follow up questions"
                : "Followed through on user's request";
              transcriptLines.push(
                `assistant (${nextMessage.id}): ${assistantSummary}`,
              );
              // Skip the assistant message in the next iteration
              i++;
            }
          }
          transcriptLines.push("");
        }
      }

      transcriptLines.push("// current message");

      return {
        success: true,
        transcript: transcriptLines.join("\n"),
        nextCursor: messagesResult.value.nextPageCursor ?? null,
      };
    },
  });

  const getDetailedMessage = tool({
    description:
      "Fetch the full, detailed message record by id, including message parts (text/tool calls/results) as stored.",
    inputSchema: jsonSchema<typeof getDetailedMessageInputSchema.infer>(
      getDetailedMessageInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ id }) {
      const context = getWebsocketContext();
      const result = await getContentCampaignMessageById({
        db: context.db,
        organizationId: context.organizationId,
        projectId: context.projectId,
        campaignId: context.campaignId,
        id,
      });
      if (!result.ok) {
        return {
          success: false,
          message: result.error.message,
        };
      }

      return {
        success: true,
        data: result.value
          ? {
              id: result.value,
              parts: result.value.message,
              role: result.value.source,
            }
          : `No message for ${id} found.`,
      };
    },
  });

  const tools = {
    get_historical_messages: getHistoricalMessages,
    get_message_detail: getDetailedMessage,
  } as const;

  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "get_historical_messages",
      toolDescription:
        "Fetch a compact transcript of previous user+assistant turns (for context recovery).",
      toolInstruction:
        "Use early when the latest user message is truncated or ambiguous. Provide turns=2-6 typically. If you need deeper context, page backwards using cursor from the response.",
      tool: getHistoricalMessages,
    },
    {
      toolName: "get_message_detail",
      toolDescription:
        "Fetch the full stored message parts for a specific message id (including tool calls/results).",
      toolInstruction:
        "Use when a prior assistant step mattered and you need the exact tool-call arguments/results. Provide id from get_historical_messages transcript.",
      tool: getDetailedMessage,
    },
  ];

  return { toolDefinitions, tools };
}
