import { openai } from "@ai-sdk/openai";
import { integrationProvidersSchema } from "@rectangular-labs/core/schemas/integration-parsers";
import {
  businessBackgroundSchema,
  imageSettingsSchema,
  publishingSettingsSchema,
  writingSettingsSchema,
} from "@rectangular-labs/core/schemas/project-parsers";
import {
  getSeoProjectByIdentifierAndOrgId,
  updateSeoProject,
} from "@rectangular-labs/db/operations";
import { Output, generateText, tool } from "ai";
import { type } from "arktype";
import type { ChatContext } from "../../../types";
import type { AgentToolDefinition } from "./utils";

export function createSettingsToolsWithMetadata(args: {
  context: Pick<ChatContext, "db" | "projectId" | "organizationId">;
}) {
  const manageSettingsInputSchema = type({
    mode: "'update' | 'display'",
    settingToUpdate:
      "'businessBackground' | 'imageSettings' | 'writingSettings' | 'publishingSettings'",
    "updateTask?": "string",
  });

  const manageSettings = tool({
    description: "Manage project settings (display or update).",
    inputSchema: manageSettingsInputSchema,
    async execute({ mode, settingToUpdate, updateTask }) {
      if (mode === "display") {
        return { success: true, message: "setting displayed to user" };
      }

      const projectResult = await getSeoProjectByIdentifierAndOrgId(
        args.context.db,
        args.context.projectId,
        args.context.organizationId,
        {
          [settingToUpdate]: true,
        },
      );

      if (!projectResult.ok) {
        return { success: false, message: projectResult.error.message };
      }
      if (!projectResult.value) {
        return { success: false, message: "Project not found" };
      }
      const project = projectResult.value;

      let currentSettings:
        | typeof businessBackgroundSchema.infer
        | typeof imageSettingsSchema.infer
        | typeof writingSettingsSchema.infer
        | typeof publishingSettingsSchema.infer
        | null
        | undefined;

      switch (settingToUpdate) {
        case "businessBackground":
          currentSettings = project.businessBackground;
          break;
        case "imageSettings":
          currentSettings = project.imageSettings;
          break;
        case "writingSettings":
          currentSettings = project.writingSettings;
          break;
        case "publishingSettings":
          currentSettings = project.publishingSettings;
          break;
      }

      const prompt = `You are an expert at configuring project settings.
Current settings:
${JSON.stringify(currentSettings, null, 2)}

Task: ${updateTask}

Keep everything as is while fulfilling the updateTask.
Respond with the new object matching the schema.`;

      const output = await (async () => {
        if (settingToUpdate === "businessBackground") {
          const result = await generateText({
            model: openai("gpt-5.1-codex-mini"),
            output: Output.object({
              schema: businessBackgroundSchema,
            }),
            prompt,
          });
          return result.output;
        }
        if (settingToUpdate === "imageSettings") {
          const result = await generateText({
            model: openai("gpt-5.1-codex-mini"),
            output: Output.object({
              schema: imageSettingsSchema,
            }),
            prompt,
          });
          return result.output;
        }
        if (settingToUpdate === "writingSettings") {
          const result = await generateText({
            model: openai("gpt-5.1-codex-mini"),
            output: Output.object({
              schema: writingSettingsSchema,
            }),
            prompt,
          });
          return result.output;
        }
        const result = await generateText({
          model: openai("gpt-5.1-codex-mini"),
          output: Output.object({
            schema: publishingSettingsSchema,
          }),
          prompt,
        });
        return result.output;
      })();

      await updateSeoProject(args.context.db, {
        id: args.context.projectId,
        organizationId: args.context.organizationId,
        [settingToUpdate]: output,
      });

      return { success: true, message: "Settings updated", settings: output };
    },
  });

  const manageIntegrationsInputSchema = type({
    provider: integrationProvidersSchema,
  });
  const manageIntegrations = tool({
    description:
      "Help the user view, connect, or manage integrations for publishing content or tracking performance.",
    inputSchema: manageIntegrationsInputSchema,
    async execute({ provider }) {
      return await Promise.resolve({
        success: true,
        message: `Integration settings for ${provider} shown to user`,
        provider,
      });
    },
  });

  const tools = {
    manage_settings: manageSettings,
    manage_integrations: manageIntegrations,
  } as const;

  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "manage_settings",
      toolDescription:
        "Display or update project settings (business background, image settings, writing settings).",
      toolInstruction:
        "Use mode='display' to show settings; mode='update' to modify. Provide settingToUpdate and a concrete updateTask describing the change to make while keeping other fields unchanged.",
      tool: manageSettings,
    },
    {
      toolName: "manage_integrations",
      toolDescription:
        "Help the user view/connect integrations. Available integrations: github (push content to repo), shopify (publish to store blog), webhook (send to any HTTP endpoint), google-search-console (track search performance).",
      toolInstruction:
        "Use when user asks about: connecting GitHub for publishing, setting up Shopify blog, configuring webhooks, connecting GSC, or when performance analysis is requested but GSC is not connected. Always provide the provider parameter.",
      tool: manageIntegrations,
    },
  ];

  return { toolDefinitions, tools };
}
