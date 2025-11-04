import { anthropic } from "@ai-sdk/anthropic";
import { ORPCError, streamToEventIterator } from "@orpc/client";
import { type } from "@orpc/server";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { withOrganizationIdBase } from "../context";
import { getProjectByIdentifier } from "../lib/database/project";
import { validateOrganizationMiddleware } from "../lib/validate-organization";

export const write = withOrganizationIdBase
  .route({ method: "POST", path: "/{id}/write" })
  .input(
    type<{
      organizationId: string;
      projectId: string;
      chatId: string;
      id: string;
      messages: UIMessage[];
    }>(),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .handler(async ({ context, input }) => {
    const projectResult = await getProjectByIdentifier(
      input.projectId,
      context.organization.id,
    );
    if (!projectResult.ok) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }
    const project = projectResult.value;
    const systemPrompt = `You are an SEO content assistant for ${
      project.name ?? project.websiteUrl
    }.

Goals:
- Help plan and write SEO-focused content for the selected campaign.
- When needed, use web_search for up-to-date context and web_fetch to open specific sources.
- Keep outputs clear, actionable, and cite sources with URLs when using web data.
- If proposing edits, describe them or use the text edit tool to suggest changes.

Project background:
- Website: ${project.websiteUrl}
- Website info: ${project.websiteInfo ? JSON.stringify(project.websiteInfo) : "(none)"}
`;

    const result = streamText({
      model: anthropic("claude-haiku-4-5"),
      messages: convertToModelMessages(input.messages),
      system: systemPrompt,
      tools: {
        web_search: anthropic.tools.webSearch_20250305({ maxUses: 3 }),
        web_fetch: anthropic.tools.webFetch_20250910({ maxUses: 2 }),
        // Minimal text edit tool stub to allow the model to propose edits without filesystem side-effects
        str_replace_based_edit_tool: anthropic.tools.textEditor_20250728({
          maxCharacters: 8000,
          async execute() {
            await Promise.resolve();
            return {
              type: "text",
              text: "Text editing is disabled in this environment. Provide proposed edits in plain text.",
            } as const;
          },
        }),
      },
      headers: {
        "anthropic-beta":
          "fine-grained-tool-streaming-2025-05-14,web-fetch-2025-09-10",
      },
      onStepFinish: (step) => {
        console.log("campaign.write step", step);
      },
      onFinish: (final) => {
        console.log("campaign.write result", final);
      },
    });

    return streamToEventIterator(
      result.toUIMessageStream({
        sendSources: true,
        sendReasoning: true,
      }),
    );
  });
