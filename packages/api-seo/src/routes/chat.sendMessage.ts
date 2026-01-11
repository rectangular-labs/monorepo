import { ORPCError, os, streamToEventIterator, type } from "@orpc/server";
import { asyncStorageMiddleware } from "@rectangular-labs/api-core/lib/context-storage";
import type { Session } from "@rectangular-labs/auth";
import { CHAT_DEFAULT_TITLE } from "@rectangular-labs/core/schemas/chat-parser";
import type { ProjectChatCurrentPage } from "@rectangular-labs/core/schemas/project-chat-parsers";
import { type schema, uuidv7 } from "@rectangular-labs/db";
import { createChat, getChatById } from "@rectangular-labs/db/operations";
import { hasToolCall, streamText } from "ai";
import { withOrganizationIdBase } from "../context";
import { createStrategistAgent } from "../lib/ai/strategist-agent";
import { createWriterAgent } from "../lib/ai/writer-agent";
import { handleTitleGeneration } from "../lib/chat/handle-title-generation";
import { getGSCPropertyById } from "../lib/database/gsc-property";
import { getProjectInChat } from "../lib/database/project";
import { validateOrganizationMiddleware } from "../lib/validate-organization";
import type { InitialContext, SeoChatMessage } from "../types";

const chatContextMiddleware = os
  .$context<
    InitialContext &
      Session & { organization: typeof schema.organization.$inferSelect }
  >()
  .middleware(
    async (
      { next, context },
      { projectId, chatId }: { projectId: string; chatId: string | undefined },
    ) => {
      const resolvedChat = await (async () => {
        if (chatId) {
          const chat = await getChatById({
            db: context.db,
            id: chatId,
            projectId,
            organizationId: context.organization.id,
          });
          if (!chat.ok) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", {
              message: "Failed to get chat",
              cause: chat.error,
            });
          }
          if (!chat.value) {
            throw new ORPCError("NOT_FOUND", { message: "Chat not found" });
          }
          return chat.value;
        }
        const chat = await createChat(context.db, {
          projectId,
          organizationId: context.organization.id,
          createdByUserId: context.user.id,
          status: "working",
        });
        if (!chat.ok) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to create chat",
            cause: chat.error,
          });
        }
        if (!chat.value) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to create chat",
          });
        }
        return chat.value;
      })();

      return await next({
        context: {
          chatId: resolvedChat.id,
          userId: context.user.id,
          sessionId: context.session.id,
          projectId,
          organizationId: context.organization.id,
          cache: {
            messages: undefined,
            project: undefined,
            gscProperty: undefined,
            chat: resolvedChat,
          },
        },
      });
    },
  );

export const sendMessage = withOrganizationIdBase
  .route({ method: "POST", path: "/sendMessage" })
  .input(
    type<{
      organizationId: string;
      projectId: string;
      currentPage: ProjectChatCurrentPage;
      messages: SeoChatMessage[];
      model?: string;
      chatId?: string;
    }>(),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .use(chatContextMiddleware, (input) => ({
    projectId: input.projectId,
    chatId: input.chatId,
  }))
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

    if (context.cache.chat?.title === CHAT_DEFAULT_TITLE) {
      const firstMessage = input.messages.at(0);
      if (!firstMessage) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Message is required to generate a title",
        });
      }
      await handleTitleGeneration({
        message: firstMessage,
        db: context.db,
        chatId: context.chatId,
        projectId: project.id,
        projectName: project.name ?? "",
        organizationId: context.organization.id,
      });
    }

    const agent = (() => {
      if (input.currentPage === "article-editor") {
        return createWriterAgent({
          project,
          context,
          messages: input.messages,
        });
      }
      return createStrategistAgent({
        project,
        context,
        messages: input.messages,
        currentPage: input.currentPage,
        gscProperty: gscProperty ?? undefined,
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
