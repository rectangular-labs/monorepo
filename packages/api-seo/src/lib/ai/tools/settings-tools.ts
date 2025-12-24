import { openai } from "@ai-sdk/openai";
import {
  getSeoProjectByIdentifierAndOrgId,
  updateSeoProject,
} from "@rectangular-labs/db/operations";
import {
  businessBackgroundSchema,
  imageSettingsSchema,
  writingSettingsSchema,
} from "@rectangular-labs/db/parsers";
import { generateObject, type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import { getWebsocketContext } from "../../../context";
import type { AgentToolDefinition } from "./tool-definition";

export function createSettingsToolsWithMetadata() {
  const manageSettingsInputSchema = type({
    mode: "'update' | 'display'",
    settingToUpdate:
      "'businessBackground' | 'imageSettings' | 'writingSettings'",
    "updateTask?": "string",
  });

  const manageSettings = tool({
    description: "Manage project settings (display or update).",
    inputSchema: jsonSchema<typeof manageSettingsInputSchema.infer>(
      manageSettingsInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ mode, settingToUpdate, updateTask }) {
      if (mode === "display") {
        return { success: true, message: "setting displayed to user" };
      }

      const context = getWebsocketContext();
      const projectResult = await getSeoProjectByIdentifierAndOrgId(
        context.db,
        context.projectId,
        context.organizationId,
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
        | null
        | undefined;
      let schemaToUse:
        | typeof businessBackgroundSchema
        | typeof imageSettingsSchema
        | typeof writingSettingsSchema;

      switch (settingToUpdate) {
        case "businessBackground":
          currentSettings = project.businessBackground;
          schemaToUse = businessBackgroundSchema;
          break;
        case "imageSettings":
          currentSettings = project.imageSettings;
          schemaToUse = imageSettingsSchema;
          break;
        case "writingSettings":
          currentSettings = project.writingSettings;
          schemaToUse = writingSettingsSchema;
          break;
      }

      const prompt = `You are an expert at configuring project settings.
Current settings:
${JSON.stringify(currentSettings, null, 2)}

Task: ${updateTask}

Keep everything as is while fulfilling the updateTask.
Respond with the new object matching the schema.`;

      const { object } = await generateObject({
        model: openai("gpt-5.1-codex-mini"),
        schema: jsonSchema<typeof schemaToUse.infer>(
          schemaToUse.toJsonSchema() as JSONSchema7,
        ),
        prompt: prompt,
      });

      await updateSeoProject(context.db, {
        id: context.projectId,
        organizationId: context.organizationId,
        [settingToUpdate]: object,
      });

      return { success: true, message: "Settings updated", settings: object };
    },
  });

  const manageIntegrationsInputSchema = type({
    integrationName: "'googleSearchConsole'",
  });
  const manageIntegrations = tool({
    description: "Manage integrations.",
    inputSchema: jsonSchema<typeof manageIntegrationsInputSchema.infer>(
      manageIntegrationsInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute() {
      return await Promise.resolve({
        success: true,
        message: "integration settings shown to user",
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
        "Help the user view/connect integrations (currently Google Search Console).",
      toolInstruction:
        "Use when the user asks about connecting/troubleshooting GSC, or when performance analysis is requested but GSC is not connected. Provide integrationName='googleSearchConsole'.",
      tool: manageIntegrations,
    },
  ];

  return { toolDefinitions, tools };
}
