import { type GoogleGenerativeAIProviderOptions, google } from "@ai-sdk/google";
import { uuidv7 } from "@rectangular-labs/db";
import { generateText, type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import { getWebsocketContext } from "../../../context";
import { apiEnv } from "../../../env";
import { captureScreenshot } from "../../cloudflare/capture-screenshot";
import { getProjectInWebsocketChat } from "../../database/project";
import { getPublicImageUri } from "../../project/get-project-image-uri";
import type { AgentToolDefinition } from "./utils";

const imageAgentInputSchema = type({
  prompt: "string",
});

const screenshotInputSchema = type({
  url: "string",
});

export function createImageToolsWithMetadata() {
  const generateImage = tool({
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
        model: google("gemini-3-pro-image-preview"),
        providerOptions: {
          google: {
            imageConfig: {
              aspectRatio: "3:2",
              imageSize: "1K",
            },
          } satisfies GoogleGenerativeAIProviderOptions,
        },
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

      const context = getWebsocketContext();
      const fileNames: string[] = [];
      for (const file of result.files) {
        const fileName = getPublicImageUri({
          orgId: context.organizationId,
          projectId: context.projectId,
          kind: "content-image",
          fileName: `${uuidv7()}.jpeg`,
        });
        await context.publicImagesBucket.storeImage(
          fileName,
          new Blob([new Uint8Array(file.uint8Array)]),
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

  const captureScreenshotTool = tool({
    description:
      "Capture a rendered screenshot of a given website URL. Uses OpenAI GPTBot user agent and 1300x1300 viewport by default. Optionally crop pixels from the bottom.",
    inputSchema: jsonSchema<typeof screenshotInputSchema.infer>(
      screenshotInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ url }) {
      if (!url) {
        return {
          success: false,
          message: "Provide a URL to capture.",
        };
      }

      const result = await captureScreenshot({
        url,
        viewport: {
          width: 1200,
          height: 1200,
          deviceScaleFactor: 1,
        },
        // to remove cookie banners
        cropBottom: 400,
      });

      if (!result.ok) {
        return {
          success: false,
          error: result.error.message,
        };
      }
      const context = getWebsocketContext();
      const fileName = getPublicImageUri({
        orgId: context.organizationId,
        projectId: context.projectId,
        kind: "content-image",
        fileName: `${uuidv7()}.jpeg`,
      });
      await context.publicImagesBucket.storeImage(
        fileName,
        new Blob([new Uint8Array(result.value.buffer)]),
      );

      return {
        success: true,
        screenshot: `${apiEnv().SEO_PUBLIC_BUCKET_URL}/${fileName}`,
      };
    },
  });

  const tools = {
    generate_image: generateImage,
    capture_screenshot: captureScreenshotTool,
  } as const;
  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "generate_image",
      toolDescription:
        "Generate a project image based on the project's image settings and a prompt.",
      toolInstruction:
        "Provide `prompt` describing the desired image. Use when the user asks for image generation. If image settings are missing, instruct the user to configure image settings first.",
      tool: generateImage,
    },
    {
      toolName: "capture_screenshot",
      toolDescription: "Capture a rendered screenshot of a given website URL.",
      toolInstruction:
        "Provide a URL to capture a screenshot of. Optionally specify cropBottom to remove pixels from the bottom of the image.",
      tool: captureScreenshotTool,
    },
  ];

  return { toolDefinitions, tools };
}
