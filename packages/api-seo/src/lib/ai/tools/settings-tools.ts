import {
  businessBackgroundJsonSchema,
  type businessBackgroundSchema,
  imageSettingsJsonSchema,
  type imageSettingsSchema,
  publishingSettingsJsonSchema,
  type publishingSettingsSchema,
  writingSettingsJsonSchema,
  type writingSettingsSchema,
} from "@rectangular-labs/core/schemas/project-parsers";
import {
  getSeoProjectByIdentifierAndOrgId,
  updateSeoProject,
} from "@rectangular-labs/db/operations";
import { generateText, jsonSchema, Output, tool } from "ai";
import type { ChatContext } from "../../../types";
import { wrappedOpenAI } from "../utils/wrapped-language-model";

export function createSettingsTools(args: {
  context: Pick<ChatContext, "db" | "projectId" | "organizationId">;
}) {
  const manageSettings = tool({
    description: "Manage project settings (display or update).",
    inputSchema: jsonSchema<{
      mode: "update" | "display";
      settingToUpdate:
        | "businessBackground"
        | "imageSettings"
        | "writingSettings"
        | "publishingSettings";
      updateTask?: string;
    }>({
      type: "object",
      additionalProperties: false,
      required: ["mode", "settingToUpdate"],
      properties: {
        mode: {
          type: "string",
          enum: ["update", "display"],
          description:
            "Use 'display' to show current settings in chat to the user. Use 'update' to apply targeted changes while preserving all unrelated fields.",
        },
        settingToUpdate: {
          type: "string",
          enum: [
            "businessBackground",
            "imageSettings",
            "writingSettings",
            "publishingSettings",
          ],
        },
        updateTask: {
          type: "string",
          description:
            "Only needed when the mode is 'update'. This provides the instruction on what in the settings we want to change.",
        },
      },
    }),
    inputExamples: [
      {
        input: {
          mode: "display",
          settingToUpdate: "writingSettings",
        },
      },
      {
        input: {
          mode: "update",
          settingToUpdate: "businessBackground",
          updateTask:
            "Add an ICP section for B2B SaaS finance teams while keeping existing positioning details.",
        },
      },
    ],
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
            model: wrappedOpenAI("gpt-5.1-codex-mini"),
            output: Output.object({
              schema: jsonSchema<
                Omit<typeof businessBackgroundSchema.infer, "version">
              >(businessBackgroundJsonSchema),
            }),
            prompt,
          });
          return result.output;
        }
        if (settingToUpdate === "imageSettings") {
          const result = await generateText({
            model: wrappedOpenAI("gpt-5.1-codex-mini"),
            output: Output.object({
              schema: jsonSchema<
                Omit<typeof imageSettingsSchema.infer, "version">
              >(imageSettingsJsonSchema),
            }),
            prompt,
          });
          return result.output;
        }
        if (settingToUpdate === "writingSettings") {
          const result = await generateText({
            model: wrappedOpenAI("gpt-5.1-codex-mini"),
            output: Output.object({
              schema: jsonSchema<
                Omit<typeof writingSettingsSchema.infer, "version">
              >(writingSettingsJsonSchema),
            }),
            prompt,
          });
          return result.output;
        }
        const result = await generateText({
          model: wrappedOpenAI("gpt-5.1-codex-mini"),
          output: Output.object({
            schema: jsonSchema<typeof publishingSettingsSchema.infer>(
              publishingSettingsJsonSchema,
            ),
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

  const manageIntegrations = tool({
    description:
      "Help the user view, connect, or manage integrations for publishing content or tracking performance.",
    inputSchema: jsonSchema<{
      provider: "github" | "webhook" | "google-search-console";
    }>({
      type: "object",
      additionalProperties: false,
      required: ["provider"],
      properties: {
        provider: {
          type: "string",
          enum: ["github", "webhook", "google-search-console"],
          description: "The provider to manage.",
        },
      },
    }),
    inputExamples: [
      { input: { provider: "google-search-console" } },
      { input: { provider: "github" } },
    ],
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
  return { tools };
}
