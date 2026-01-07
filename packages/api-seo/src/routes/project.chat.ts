import { ORPCError, os, streamToEventIterator, type } from "@orpc/server";
import { asyncStorageMiddleware } from "@rectangular-labs/api-core/lib/context-storage";
import type { Session } from "@rectangular-labs/auth";
import type { ProjectChatCurrentPage } from "@rectangular-labs/core/schemas/project-chat-parsers";
import { getWorkspaceBlobUri } from "@rectangular-labs/core/workspace/get-workspace-blob-uri";
import { type schema, uuidv7 } from "@rectangular-labs/db";
import { hasToolCall, streamText } from "ai";
import { CrdtType } from "loro-protocol";
import { withOrganizationIdBase } from "../context";
import { createStrategistAgent } from "../lib/ai/strategist-agent";
import { createWriterAgent } from "../lib/ai/writer-agent";
import { getRoomKey } from "../lib/chat/get-room-key";
import { getGSCPropertyById } from "../lib/database/gsc-property";
import { validateOrganizationMiddleware } from "../lib/validate-organization";
import { WORKSPACE_CONTENT_ROOM_ID } from "../lib/workspace/constants";
import type { ChatContext, InitialContext, SeoChatMessage } from "../types";

const chatContextMiddleware = os
  .$context<
    InitialContext &
      Session & { organization: typeof schema.organization.$inferSelect }
  >()
  .middleware(async ({ next, context }, projectId: string) => {
    return await next({
      context: {
        projectId,
        organizationId: context.organization.id,
        userId: context.user.id,
        sessionId: context.session.id,
        roomDocumentMap: new Map(),
        cache: {
          messages: undefined,
          project: undefined,
          gscProperty: undefined,
        },
      },
    });
  });

async function persistDirtyWorkspaceSnapshot(context: ChatContext) {
  const roomDoc = context.roomDocumentMap.get(
    getRoomKey(WORKSPACE_CONTENT_ROOM_ID, CrdtType.Loro),
  );
  if (!roomDoc?.dirty || !roomDoc.descriptor.shouldPersist) return;

  await context.workspaceBucket.setSnapshot(
    getWorkspaceBlobUri({
      orgId: context.organizationId,
      projectId: context.projectId,
      campaignId: undefined,
    }),
    roomDoc.data,
  );
  roomDoc.dirty = false;
}

export const chat = withOrganizationIdBase
  .route({ method: "POST", path: "/{projectId}/chat" })
  .input(
    type<{
      organizationIdentifier: string;
      projectId: string;
      currentPage: ProjectChatCurrentPage;
      messages: SeoChatMessage[];
      model?: string;
    }>(),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .use(chatContextMiddleware, (input) => input.projectId)
  // TODO: clean up this hack to reinitialize the context for the chat items. rn  it runs in a double closure
  .use(asyncStorageMiddleware<InitialContext>())
  .handler(async ({ context, input }) => {
    const project = await context.db.query.seoProject.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.id, input.projectId),
          eq(table.organizationId, context.organization.id),
        ),
      with: {
        authors: true,
      },
    });
    if (!project) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    const gscProperty = await (async () => {
      if (!project.gscPropertyId) return null;
      const result = await getGSCPropertyById(project.gscPropertyId);
      if (!result.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to load GSC property",
          cause: result.error,
        });
      }
      return result.value;
    })();

    const agent = (() => {
      if (input.currentPage === "article-editor") {
        return createWriterAgent({
          messages: input.messages,
          project,
          publicImagesBucket: context.publicImagesBucket,
          cacheKV: context.cacheKV,
        });
      }
      return createStrategistAgent({
        messages: input.messages,
        gscProperty: gscProperty ?? undefined,
        project,
        userId: context.user.id,
        currentPage: input.currentPage,
        cacheKV: context.cacheKV,
      });
    })();

    const result = streamText({
      ...agent,
      onError: (error) => {
        console.error("project.chat error", error);
      },
      stopWhen: [
        hasToolCall("ask_questions"),
        hasToolCall("create_plan"),
        hasToolCall("manage_integrations"),
      ],
    });

    const assistantMessageId = uuidv7();
    return streamToEventIterator(
      result.toUIMessageStream<SeoChatMessage>({
        sendSources: true,
        sendReasoning: true,
        generateMessageId: () => assistantMessageId,
        messageMetadata: ({ part }) => {
          if (part.type === "start") {
            return {
              sentAt: new Date().toISOString(),
              userId: null,
            };
          }
          return;
        },
        onFinish: async () => {
          try {
            await persistDirtyWorkspaceSnapshot(context);
          } catch (error) {
            console.error(
              "project.chat workspace snapshot persist error",
              error,
            );
          }
        },
      }),
    );
  });
