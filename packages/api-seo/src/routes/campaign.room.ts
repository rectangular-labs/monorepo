import { ORPCError, type } from "@orpc/server";
import { createContentCampaignMessage } from "@rectangular-labs/db/operations";
import { safeSync } from "@rectangular-labs/result";
import { createIdGenerator, hasToolCall, stepCountIs, streamText } from "ai";
import { websocketBase } from "../context";
import { createSeoAgent } from "../lib/ai/seo-agent";
import { getGSCPropertyById } from "../lib/database/gsc-property";
import { getProjectByIdentifier } from "../lib/database/project";
import type { SeoChatMessage } from "../types";

// TODO: broadcasting to clients when messages are done
const room = websocketBase
  .route({ method: "GET", path: "/{id}/room" })
  .input(
    type<{
      messages: SeoChatMessage[];
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
      latestUserMessage.metadata ??= {
        userId: context.userId,
        sentAt: new Date().toISOString(),
      };

      await createContentCampaignMessage({
        db: context.db,
        value: {
          organizationId: context.organizationId,
          projectId: context.projectId,
          campaignId: context.campaignId,
          userId: latestUserMessage.metadata.userId,
          message: latestUserMessage.parts,
          source: "user",
        },
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

    void result.consumeStream();

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
      // Generate consistent server-side IDs for persistence:
      generateMessageId: createIdGenerator({
        prefix: "msg",
        size: 16,
      }),
      onFinish: async ({ responseMessage }) => {
        await createContentCampaignMessage({
          db: context.db,
          value: {
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
        const wsSendResult = safeSync(() => ws.send(JSON.stringify(chunk)));
        if (
          !wsSendResult.ok &&
          wsSendResult.error.message.includes(
            "Can't call WebSocket send() after close().",
          )
        ) {
          continue;
        }
        if (!wsSendResult.ok) {
          throw wsSendResult.error;
        }
      }
    }
  });

export default websocketBase
  .prefix(
    "/api/realtime/organization/{organizationId}/project/{projectId}/campaign",
  )
  .router({ room });
