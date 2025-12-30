import { ORPCError, type } from "@orpc/server";
import { CAMPAIGN_DEFAULT_TITLE } from "@rectangular-labs/core/schemas/content-campaign-parser";
import { getWorkspaceBlobUri } from "@rectangular-labs/core/workspace/get-workspace-blob-uri";
import { uuidv7 } from "@rectangular-labs/db";
import { hasToolCall, streamText } from "ai";
import { CrdtType } from "loro-protocol";
import { websocketBase } from "../context";
import { createStrategistAgent } from "../lib/ai/strategist-agent";
import { broadcastMessageToRoom } from "../lib/chat/broadcast-to-room";
import { getRoomKey } from "../lib/chat/get-room-key";
import { handleTitleGeneration } from "../lib/chat/handle-title-generation";
import { handleWebsocketMessage } from "../lib/chat/handle-websocket-message";
import { getGSCPropertyInWebsocketChat } from "../lib/database/gsc-property";
import { getProjectInWebsocketChat } from "../lib/database/project";
import { WORKSPACE_CONTENT_ROOM_ID } from "../lib/workspace/constants";
import type { SeoChatMessage } from "../types";

const room = websocketBase
  .route({ method: "GET", path: "/{id}/room" })
  .input(
    type<{
      messages: SeoChatMessage[];
      messageId?: string;
      clientMessageId: string;
    }>(),
  )
  .handler(async ({ context, input }) => {
    const projectResult = await getProjectInWebsocketChat();
    if (!projectResult.ok || !projectResult.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "Project not found",
        cause: "error" in projectResult ? projectResult.error : undefined,
      });
    }
    const project = projectResult.value;

    const gscPropertyResult = await getGSCPropertyInWebsocketChat();
    if (!gscPropertyResult.ok || !gscPropertyResult.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "Google Search Console property not found",
        cause:
          "error" in gscPropertyResult ? gscPropertyResult.error : undefined,
      });
    }
    const gscProperty = gscPropertyResult.value;

    const latestMessage = input.messages.at(-1);
    if (latestMessage?.role === "user") {
      const userMessageResult = await handleWebsocketMessage({
        // we let the db generate the id for the user message
        message: { ...latestMessage, id: "" },
        userId: context.userId,
        broadcast: true,
      });
      if (!userMessageResult.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to handle user message",
          cause: userMessageResult.error,
        });
      }
    }

    if (context.campaignTitle === CAMPAIGN_DEFAULT_TITLE && latestMessage) {
      console.log("Generating title for campaign", context.campaignId);
      await handleTitleGeneration(latestMessage);
    }

    const planResult = streamText({
      ...createStrategistAgent({
        messages: input.messages,
        gscProperty,
        project,
        userId: context.userId,
      }),
      onStepFinish: (step) => {
        console.log("campaign.write step", step);
      },
      onError: (error) => {
        console.error("campaign.write error", error);
      },
      stopWhen: [
        hasToolCall("ask_questions"),
        hasToolCall("create_plan"),
        hasToolCall("manage_integrations"),
      ],
    });

    const assistantMessageId = uuidv7();
    // Handle streaming text chunks using UIMessageStream
    for await (const chunk of planResult.toUIMessageStream<SeoChatMessage>({
      sendSources: true,
      sendReasoning: true,
      messageMetadata: ({ part }) => {
        if (part.type === "start") {
          return {
            sentAt: new Date().toISOString(),
            userId: null,
          };
        }
        return;
      },
      generateMessageId: () => assistantMessageId,
      onFinish: async ({ responseMessage }) => {
        const result = await handleWebsocketMessage({
          message: responseMessage,
          userId: null,
          broadcast: false,
        });
        if (!result.ok) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to handle assistant message",
            cause: result.error,
          });
        }
        console.log("campaign.room planner message", responseMessage);

        const roomDoc = context.roomDocumentMap.get(
          getRoomKey(WORKSPACE_CONTENT_ROOM_ID, CrdtType.Loro),
        );
        if (roomDoc?.dirty && roomDoc.descriptor.shouldPersist) {
          await context.workspaceBucket.setSnapshot(
            getWorkspaceBlobUri({
              orgId: context.organizationId,
              projectId: context.projectId,
              campaignId: context.campaignId,
            }),
            roomDoc.data,
          );
          roomDoc.dirty = false;
        }
      },
    })) {
      broadcastMessageToRoom(
        {
          type: "msg-chunk",
          clientMessageId: input.clientMessageId,
          chunk,
        },
        false,
      );
    }
  });

export default websocketBase
  .prefix(
    "/api/realtime/organization/{organizationId}/project/{projectId}/campaign",
  )
  .router({ room });
