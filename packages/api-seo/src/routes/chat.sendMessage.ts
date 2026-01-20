import { waitUntil } from "cloudflare:workers";
import { ORPCError, os, streamToEventIterator, type } from "@orpc/server";
import { asyncStorageMiddleware } from "@rectangular-labs/api-core/lib/context-storage";
import type { Session } from "@rectangular-labs/auth";
import { CHAT_DEFAULT_TITLE } from "@rectangular-labs/core/schemas/chat-parser";
import type { ProjectChatCurrentPage } from "@rectangular-labs/core/schemas/project-chat-parsers";
import { type schema, uuidv7 } from "@rectangular-labs/db";
import {
  createChat,
  createChatMessage,
  getChatById,
  updateChat,
} from "@rectangular-labs/db/operations";
import { hasToolCall, streamText } from "ai";
import { type as arktype } from "arktype";
import { withOrganizationIdBase } from "../context";
import { createStrategistAgent } from "../lib/ai/strategist-agent";
import { createWriterAgent } from "../lib/ai/writer-agent";
import { handleTitleGeneration } from "../lib/chat/handle-title-generation";
import { getGscIntegrationForProject } from "../lib/database/gsc-integration";
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
      { projectId, chatId }: { projectId: string; chatId: string | null },
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
          const updatedChatResult = await updateChat({
            db: context.db,
            values: {
              id: chat.value.id,
              projectId,
              organizationId: context.organization.id,
              status: "working",
            },
          });
          if (!updatedChatResult.ok) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", {
              message: "Failed to update chat",
              cause: updatedChatResult.error,
            });
          }
          return updatedChatResult.value;
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

      console.log("[chat.sendMessage] chatContextMiddleware resolved chat", {
        chatId: resolvedChat.id,
        chatStatus: resolvedChat.status,
      });

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
      messageId?: string;
      model?: string;
      chatId: string | null;
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

    const gscIntegrationResult = await getGscIntegrationForProject({
      db: context.db,
      projectId: project.id,
      organizationId: context.organization.id,
    });
    if (!gscIntegrationResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load GSC integration",
        cause: gscIntegrationResult.error,
      });
    }
    const gscIntegration = gscIntegrationResult.value;

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
      console.log("[chat.sendMessage] Title generation completed");
    }

    const latestUserMessage = (() => {
      for (let i = input.messages.length - 1; i >= 0; i -= 1) {
        if (input.messages[i]?.role === "user") {
          return input.messages[i];
        }
      }
      return undefined;
    })();
    // unsaved user message has a client generated ID
    const userMessageId = latestUserMessage?.id;
    if (
      latestUserMessage &&
      arktype("string.uuid")(userMessageId) instanceof arktype.errors
    ) {
      const createdUserMessage = await createChatMessage({
        db: context.db,
        value: {
          organizationId: context.organization.id,
          projectId: context.projectId,
          chatId: context.chatId,
          source: "user",
          userId: context.user.id,
          message: latestUserMessage.parts,
        },
      });
      if (!createdUserMessage.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create user chat message",
          cause: createdUserMessage.error,
        });
      }
    }

    const agent = (() => {
      if (input.currentPage === "article-editor") {
        const writerAgent = createWriterAgent({
          project,
          context,
          messages: input.messages,
        });
        return writerAgent;
      }
      const strategistAgent = createStrategistAgent({
        project,
        context,
        messages: input.messages,
        currentPage: input.currentPage,
        gscProperty: gscIntegration ?? undefined,
      });
      return strategistAgent;
    })();

    const result = streamText({
      ...agent,
      onError: (error) => {
        console.error("[chat.sendMessage] streamText onError", {
          error,
        });
      },
      onStepFinish: (step) => {
        console.log("[chat.sendMessage] step finished", {
          text: step?.text,
          toolResults: step?.toolResults,
          toolCallCount: Array.isArray(step?.toolCalls)
            ? step.toolCalls.length
            : 0,
        });
      },
      stopWhen: [
        hasToolCall("ask_questions"),
        hasToolCall("create_plan"),
        hasToolCall("manage_integrations"),
      ],
    });
    console.log("[chat.sendMessage] streamText result created");
    waitUntil(
      result.consumeStream({
        onError: (error) => {
          console.error("[chat.sendMessage] consumeStream onError", {
            error,
          });
        },
      }),
    );
    const uiMessageStream = result.toUIMessageStream<SeoChatMessage>({
      sendSources: true,
      sendReasoning: true,
      generateMessageId: uuidv7,
      messageMetadata: ({ part }) => {
        if (part.type === "start") {
          console.log("[chat.sendMessage] messageMetadata - start part");
          return {
            sentAt: new Date().toISOString(),
            userId: null,
            chatId: context.chatId,
          };
        }
        return;
      },
      onFinish: async ({ responseMessage }) => {
        console.log("[chat.sendMessage] onFinish called", {
          responseMessageId: responseMessage?.id,
          responseMessagePartCount: responseMessage?.parts?.length ?? 0,
        });
        const [updatedChat, createdChatMessage] = await Promise.all([
          updateChat({
            db: context.db,
            values: {
              id: context.chatId,
              projectId: context.projectId,
              organizationId: context.organization.id,
              status: "idle",
            },
          }),
          createChatMessage({
            db: context.db,
            value: {
              id: responseMessage.id,
              organizationId: context.organization.id,
              projectId: context.projectId,
              chatId: context.chatId,
              source: "assistant",
              message: responseMessage.parts,
            },
          }),
        ]);
        if (!updatedChat.ok) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to update chat",
            cause: updatedChat.error,
          });
        }
        if (!createdChatMessage.ok) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to create chat message",
            cause: createdChatMessage.error,
          });
        }
      },
    });
    return streamToEventIterator(uiMessageStream);
  });
