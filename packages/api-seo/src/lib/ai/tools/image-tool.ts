import { google } from "@ai-sdk/google";
import { uuidv7 } from "@rectangular-labs/db";
import { generateText, type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import { Jimp } from "jimp";
import { getWebsocketContext } from "../../../context";
import { apiEnv } from "../../../env";
import { getProjectInWebsocketChat } from "../../database/project";
import { getPublicImageUri } from "../../project/get-project-image-uri";
import type { AgentToolDefinition } from "./utils";

const imageAgentInputSchema = type({
  prompt: "string",
});

export function createImageToolWithMetadata() {
  const createImage = tool({
    description: "Generate an image for a project",
    inputSchema: jsonSchema<typeof imageAgentInputSchema.infer>(
      imageAgentInputSchema.toJsonSchema() as JSONSchema7,
    ),
    execute: async ({ prompt }) => {
      const imageSettingsResult = await getProjectInWebsocketChat();
      if (!imageSettingsResult.ok) {
        throw imageSettingsResult.error;
      }
      if (
        !imageSettingsResult.value ||
        !imageSettingsResult.value.imageSettings
      ) {
        return {
          message:
            "No image settings found for project. Please ask the user to set up image settings.",
        };
      }
      const { imageSettings } = imageSettingsResult.value;

      const result = await generateText({
        model: google("gemini-3-pro-image"),
        system: `You are an image agent for a project. You are given a prompt and you need to generate an image for the project. The image settings are ${JSON.stringify(imageSettings)}.`,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              // todo: inject style references and brand logos
            ],
          },
        ],
      }).catch((error) => {
        console.error("Error in image tool", error);
        return {
          message: "Failed to generate image.",
          error: error.message,
          files: [],
        };
      });

      console.log("result.files", result.files);
      const context = getWebsocketContext();
      const fileNames: string[] = [];
      for (const file of result.files) {
        console.log("file.mediaType", file.mediaType);
        const image = await Jimp.read(file.base64);
        const buffer = await image.getBuffer("image/jpeg");
        const fileName = getPublicImageUri({
          orgId: context.organizationId,
          projectId: context.projectId,
          kind: "content-image",
          fileName: `${uuidv7()}.jpeg`,
        });
        await context.publicImagesBucket.storeImage(
          fileName,
          new Blob([new Uint8Array(buffer)]),
        );
        fileNames.push(fileName);
      }

      return {
        message: `Generated ${fileNames.length} images for the project.`,
        imageUris: fileNames.map(
          (fileName) => `${apiEnv().SEO_PUBLIC_BUCKET_URL}/${fileName}`,
        ),
      };
    },
  });

  const tools = { create_image: createImage } as const;
  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "create_image",
      toolDescription:
        "Generate a project image based on the project's image settings and a prompt.",
      toolInstruction:
        "Provide `prompt` describing the desired image. Use when the user asks for image generation. If image settings are missing, instruct the user to configure image settings first.",
      tool: createImage,
    },
  ];

  return { toolDefinitions, tools };
}
