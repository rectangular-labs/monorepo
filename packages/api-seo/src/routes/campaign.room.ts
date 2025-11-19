import { ORPCError, type } from "@orpc/server";
import { uuidv7 } from "@rectangular-labs/db";
import { createContentCampaignMessage } from "@rectangular-labs/db/operations";
import { hasToolCall, stepCountIs, streamText } from "ai";
import { websocketBase } from "../context";
import { createSeoAgent } from "../lib/ai/seo-agent";
import { getGSCPropertyById } from "../lib/database/gsc-property";
import { getProjectByIdentifier } from "../lib/database/project";
import { broadcastMessageToRoom } from "../lib/workspace/broadcast-to-room";
import { sendWebsocketMessage } from "../lib/workspace/send-websocket-message";
import type { SeoChatMessage } from "../types";

// TODO: broadcasting to clients when messages are done
const room = websocketBase
  .route({ method: "GET", path: "/{id}/room" })
  .input(
    type<{
      messages: SeoChatMessage[];
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

    const latestUserMessage = [...input.messages]
      .reverse()
      .find((message) => message.role === "user");

    if (latestUserMessage) {
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
