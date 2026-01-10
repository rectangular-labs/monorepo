import { ORPCError, os, streamToEventIterator, type } from "@orpc/server";
import { asyncStorageMiddleware } from "@rectangular-labs/api-core/lib/context-storage";
import type { Session } from "@rectangular-labs/auth";
import type { ProjectChatCurrentPage } from "@rectangular-labs/core/schemas/project-chat-parsers";
import { type schema, uuidv7 } from "@rectangular-labs/db";
import { hasToolCall, streamText } from "ai";
import { withOrganizationIdBase } from "../context";
import { createStrategistAgent } from "../lib/ai/strategist-agent";
import { createWriterAgent } from "../lib/ai/writer-agent";
import { getGSCPropertyById } from "../lib/database/gsc-property";
import { getProjectInChat } from "../lib/database/project";
import { validateOrganizationMiddleware } from "../lib/validate-organization";
import type { InitialContext, SeoChatMessage } from "../types";

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
        cache: {
          messages: undefined,
          project: undefined,
          gscProperty: undefined,
        },
      },
    });
  });

export const sendMessage = withOrganizationIdBase
  .route({ method: "POST", path: "/sendMessage" })
  .input(
    type<{
      organizationId: string;
      projectId: string;
      currentPage: ProjectChatCurrentPage;
      messages: SeoChatMessage[];
      model?: string;
    }>(),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .use(chatContextMiddleware, (input) => input.projectId)
  // TODO: clean up this hack to reinitialize the context for the chat items. rn  it runs in a double closure
  .use(asyncStorageMiddleware<InitialContext>())
  .handler(async ({ context, input }) => {
    await getProjectInChat;
    const projectResult = await getProjectInChat({
      context,
    });
    if (!projectResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Something went wrong loading the project",
        cause: projectResult.error,
      });
    }
    if (!projectResult.value) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }
    const project = projectResult.value;

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
          context: {
            db: context.db,
            organizationId: context.organizationId,
            projectId: context.projectId,
            chatId: null,
          },
          cacheKV: context.cacheKV,
        });
      }
      return createStrategistAgent({
        messages: input.messages,
        gscProperty: gscProperty ?? undefined,
        project,
        userId: context.user.id,
        context: {
          db: context.db,
          organizationId: context.organizationId,
          projectId: context.projectId,
          chatId: null,
        },
        currentPage: input.currentPage,
        cacheKV: context.cacheKV,
      });
    })();

    const result = streamText({
      ...agent,
      onError: (error) => {
        console.error("chat.sendMessage error", error);
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
      }),
    );
  });
