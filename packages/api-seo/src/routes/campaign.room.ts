import { anthropic } from "@ai-sdk/anthropic";
import { ORPCError, type } from "@orpc/server";
import { uuidv7 } from "@rectangular-labs/db";
import {
  createContentCampaignMessage,
  updateContentCampaign,
} from "@rectangular-labs/db/operations";
import { CAMPAIGN_DEFAULT_TITLE } from "@rectangular-labs/db/parsers";
import {
  convertToModelMessages,
  generateText,
  hasToolCall,
  stepCountIs,
  streamText,
} from "ai";
import { CrdtType } from "loro-protocol";
import { websocketBase } from "../context";
import { createSeoAgent } from "../lib/ai/seo-agent";
import { getGSCPropertyById } from "../lib/database/gsc-property";
import { getProjectByIdentifier } from "../lib/database/project";
import {
  getRoomKey,
  getWorkspaceBlobUri,
  WORKSPACE_CONTENT_ROOM_ID,
} from "../lib/workspace";
import { broadcastMessageToRoom } from "../lib/workspace/broadcast-to-room";
import { sendWebsocketMessage } from "../lib/workspace/send-websocket-message";
import type { SeoChatMessage } from "../types";

// TODO: broadcasting to clients when messages are done
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
    const projectResult = await getProjectByIdentifier(
      context.projectId,
      context.organizationId,
    );
    if (!projectResult.ok) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }
    const project = projectResult.value;
    const gscProperty = await (async () => {
      if (!project.gscPropertyId) {
        return null;
      }
      const property = await getGSCPropertyById(project.gscPropertyId);
      if (!property.ok) {
        throw new ORPCError("NOT_FOUND", {
          message: `Google Search Console property not found: ${project.gscPropertyId}`,
          cause: property.error,
        });
      }
      return property.value;
    })();

    const latestUserMessage = input.messages.at(-1);
    if (latestUserMessage && latestUserMessage.role === "user") {
      const messageResult = await createContentCampaignMessage({
        db: context.db,
        value: {
          organizationId: context.organizationId,
          projectId: context.projectId,
          campaignId: context.campaignId,
          userId: context.userId,
          message: latestUserMessage.parts,
          source: "user",
        },
      });
      if (!messageResult.ok) {
        throw messageResult.error;
      }
      broadcastMessageToRoom(
        {
          type: "new-msg",
          message: {
            id: messageResult.value.id,
            role: "user",
            parts: latestUserMessage.parts,
            metadata: {
              sentAt: messageResult.value.createdAt.toISOString(),
              userId: messageResult.value.userId,
            },
          },
        },
        true,
      );
    }

    if (context.campaignTitle === CAMPAIGN_DEFAULT_TITLE && latestUserMessage) {
      console.log("Generating title for campaign", context.campaignId);
      const updatedTitle = await generateText({
        model: anthropic("claude-haiku-4-5"),
        system:
          "Based on the user's message extract out the main topic and generate a concise and succinct title for this campaign. JUST RETURN WITH A TITLE AND NOTHING ELSE. The title should be no more than 10 words.",
        messages: convertToModelMessages([
          latestUserMessage,
          {
            role: "user",
            parts: [
              {
                type: "text",
                text: `The above is my initial question/task for my site ${project.name}. Use that to generate a title for this campaign`,
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

    const result = streamText({
      ...createSeoAgent({
        messages: input.messages,
        gscProperty,
        project,
      }),
      onStepFinish: (step) => {
        console.log("campaign.write step", step);
      },
      onError: (error) => {
        console.error("campaign.write error", error);
      },
      stopWhen: [stepCountIs(10), hasToolCall("manage_google_search_property")],
    });

    // Handle streaming text chunks using UIMessageStream
    for await (const chunk of result.toUIMessageStream({
      sendSources: true,
      sendReasoning: true,
      messageMetadata: ({ part }) => {
        if (part.type === "start") {
          return {
            sentAt: new Date().toISOString(),
          };
        }
        return;
      },
      generateMessageId: uuidv7,
      onFinish: async ({ responseMessage }) => {
        await createContentCampaignMessage({
          db: context.db,
          value: {
            id: responseMessage.id,
            organizationId: context.organizationId,
            projectId: context.projectId,
            campaignId: context.campaignId,
            userId: null,
            message: responseMessage.parts,
            source: "assistant",
          },
        });
        console.log("campaign.room ai message", responseMessage);

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
      for (const ws of context.allWebSockets) {
        sendWebsocketMessage(
          ws,
          JSON.stringify({
            type: "msg-chunk",
            clientMessageId: input.clientMessageId,
            chunk,
          }),
        );
      }
    }
  });

export default websocketBase
  .prefix(
    "/api/realtime/organization/{organizationId}/project/{projectId}/campaign",
  )
  .router({ room });
