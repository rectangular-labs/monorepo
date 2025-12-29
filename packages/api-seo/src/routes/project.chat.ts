import { ORPCError, os, streamToEventIterator, type } from "@orpc/server";
import { asyncStorageMiddleware } from "@rectangular-labs/api-core/lib/context-storage";
import type { Session } from "@rectangular-labs/auth";
import { type schema, uuidv7 } from "@rectangular-labs/db";
import { hasToolCall, streamText } from "ai";
import { type as arkType } from "arktype";
import { withOrganizationIdBase } from "../context";
import { createStrategistAgent } from "../lib/ai/strategist-agent";
import { createWriterAgent } from "../lib/ai/writer-agent";
import { getGSCPropertyById } from "../lib/database/gsc-property";
import { validateOrganizationMiddleware } from "../lib/validate-organization";
import type {
  InitialContext,
  SeoChatMessage,
  WebSocketContext,
} from "../types";

const currentPageSchema = arkType(
  "'content-planner'|'content-list'|'stats'|'settings'|'article-editor'",
);

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

export const chat = withOrganizationIdBase
  .route({ method: "POST", path: "/{projectId}/chat" })
  .input(
    type<{
      organizationIdentifier: string;
      projectId: string;
      currentPage: typeof currentPageSchema.infer;
      messages: SeoChatMessage[];
      model?: string;
    }>(),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .use(chatContextMiddleware, (input) => input.projectId)
  // TODO: clean up this hack to reinitialize the context for the chat items. rn  it runs in a double closure
  .use(asyncStorageMiddleware<InitialContext>())
  .handler(async ({ context, input }) => {
    const project: WebSocketContext["cache"]["project"] =
      await context.db.query.seoProject.findFirst({
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
        });
      }
      return createStrategistAgent({
        messages: input.messages,
        gscProperty: gscProperty ?? undefined,
        project,
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
      }),
    );
  });
