import { ORPCError, streamToEventIterator, type } from "@orpc/server";
import { uuidv7 } from "@rectangular-labs/db";
import { hasToolCall, streamText } from "ai";
import { withOrganizationIdBase } from "../context";
import { getGSCPropertyById } from "../lib/database/gsc-property";
import { createWriterAgent } from "../lib/ai/writer-agent";
import { createStrategistAgent } from "../lib/ai/strategist-agent";
import { validateOrganizationMiddleware } from "../lib/validate-organization";
import type { SeoChatMessage, WebSocketContext } from "../types";

const currentPageSchema = type(
  "'content-planner'|'content-list'|'stats'|'settings'|'article-editor'",
);

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
  .handler(async ({ context, input }) => {
    const project: NonNullable<WebSocketContext["cache"]["project"]> | null =
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
        gscProperty,
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


