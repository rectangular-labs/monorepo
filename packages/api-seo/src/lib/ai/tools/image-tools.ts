import { type GoogleGenerativeAIProviderOptions, google } from "@ai-sdk/google";
import { getExtensionFromMimeType } from "@rectangular-labs/core/project/get-extension-from-mimetype";
import type { imageSettingsSchema } from "@rectangular-labs/core/schemas/project-parsers";
import { uuidv7 } from "@rectangular-labs/db";
import {
  generateObject,
  generateText,
  type JSONSchema7,
  jsonSchema,
  tool,
} from "ai";
import { type } from "arktype";
import { apiEnv } from "../../../env";
import type { InitialContext } from "../../../types";
import { getPublicImageUri } from "../../project/get-project-image-uri";
import { storeOptimizedOrOriginalImage } from "../utils/store-optimized-or-original-image";
import { captureScreenshotOne } from "./image-tools.capture-screenshotone";
import {
  type StockImageCandidate,
  searchPexels,
  searchPixabay,
  searchUnsplash,
} from "./image-tools.image-providers";
import type { AgentToolDefinition } from "./utils";

const imageAgentInputSchema = type({
  prompt: type("string").describe("The prompt to generate an image for."),
});

const screenshotInputSchema = type({
  url: type("string.url").describe("The URL to capture a screenshot of."),
  viewportWidth: type("number.integer >= 480")
    .describe("The width of the viewport to capture a screenshot of.")
    .default(1280),
  viewportHeight: type("number.integer >= 480")
    .describe("The height of the viewport to capture a screenshot of.")
    .default(720),
  fullPage: type("boolean")
    .describe("Whether to capture a full page screenshot.")
    .default(false),
});

const stockImageInputSchema = type({
  searchQuery: type("string").describe(
    "The search query that describes the image to search for.",
  ),
  orientation: type("'landscape'|'portrait'|'square'")
    .describe("The orientation of the image to search for.")
    .default("landscape"),
});

async function selectBestStockImageIndex(args: {
  query: string;
  candidates: StockImageCandidate[];
}): Promise<number> {
  const selectionSchema = type({ index: "number.integer >= -1" });
  const { object } = await generateObject({
    model: google("gemini-3-flash-preview"),
    schema: jsonSchema<typeof selectionSchema.infer>(
      selectionSchema.toJsonSchema() as JSONSchema7,
    ),
    system:
      "You pick the best matching image for a query. Return JSON only with an integer `index` corresponding to the index of the best matching image in the list of candidates. Return -1 if none of the pictures match the query well.",
    messages: [
      {
        role: "user",
        content: [
          ...args.candidates.slice(0, 5).map((candidate) => ({
            type: "image" as const,
            image: new URL(candidate.imageUrl),
          })),
          {
            type: "text",
            text: `Query: ${args.query}
Attached are ${args.candidates.length} images. Return {"index": N} where N is -1..${args.candidates.length - 1} inclusive. The index corresponds to the index of the best matching image in the list of candidates for the query. -1 should be returned if none match.`,
          },
        ],
      },
    ],
  });

  const index = typeof object.index === "number" ? object.index : -1;
  if (index < -1 || index >= args.candidates.length) return -1;
  return index;
}

export function createImageToolsWithMetadata(args: {
  organizationId: string;
  projectId: string;
  imageSettings: typeof imageSettingsSchema.infer | null;
  publicImagesBucket: InitialContext["publicImagesBucket"];
}) {
  const generateImage = tool({
    description: "Generate an image based on a prompt.",
    inputSchema: jsonSchema<typeof imageAgentInputSchema.infer>(
      imageAgentInputSchema.toJsonSchema() as JSONSchema7,
    ),
    execute: async ({ prompt }) => {
      const { imageSettings } = args;
      if (!imageSettings) {
        return {
          success: false as const,
          message:
            "No image settings found for project. Please ask the user to set up image settings or use either the screenshot or stock image tools.",
        };
      }

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
          files: [],
        };
      });

      const { organizationId, projectId, publicImagesBucket } = args;
      const fileNames: string[] = [];
      for (const file of result.files) {
        const originalContentType = file.mediaType || "image/jpeg";
        const originalExt = getExtensionFromMimeType(originalContentType);
        const originalKey = getPublicImageUri({
          orgId: organizationId,
          projectId,
          kind: "content-image",
          fileName: `${uuidv7()}.${originalExt}`,
        });
        const stored = await storeOptimizedOrOriginalImage({
          bucket: publicImagesBucket,
          bytes: new Uint8Array(file.uint8Array),
          key: originalKey,
          mimeType: originalContentType,
        });
        if (!stored.ok) {
          console.error("Failed to store generated image", stored.error);
          continue;
        }
        fileNames.push(stored.value.key);
      }

      if (!fileNames.length) {
        return {
          success: false as const,
          message:
            "Generated images, but failed to store them. Please try again or use a different tool.",
        };
      }

      return {
        success: true as const,
        message: `Generated ${fileNames.length} images for the project.`,
        imageUris: fileNames.map(
          (fileName) => `${apiEnv().SEO_PUBLIC_BUCKET_URL}/${fileName}`,
        ),
      };
    },
    // toModelOutput(result) {
    //   return {
    //     type: "content",
    //     value: [
    //       {
    //         type: "text" as const,
    //         text: result.success ? result.imageUris.join(", ") : result.message,
    //       },
    //       ...(result.imageUris?.map((uri) => ({
    //         type: "media" as const,
    //         data: uri,
    //         mediaType: "image/jpeg",
    //       })) ?? []),
    //     ],
    //   };
    // },
  });

  const findStockImage = tool({
    description:
      "Find an royalty-free stock image based on a search query. Returns the best match with attribution details.",
    inputSchema: jsonSchema<typeof stockImageInputSchema.infer>(
      stockImageInputSchema.toJsonSchema() as JSONSchema7,
    ),
    execute: async ({ searchQuery, orientation }) => {
      const providers: (typeof imageSettingsSchema.infer)["stockImageProviders"] =
        args.imageSettings?.stockImageProviders ?? [
          "pixabay",
          "unsplash",
          "pexels",
        ];
      const effectiveOrientation = orientation ?? "landscape";

      const providerSearchers = {
        unsplash: searchUnsplash,
        pexels: searchPexels,
        pixabay: searchPixabay,
      };

      for (const provider of providers) {
        const search = providerSearchers[provider];
        if (!search) continue;

        const candidates = await search({
          query: searchQuery,
          orientation: effectiveOrientation,
        }).catch(() => []);
        if (!candidates.length) continue;

        const pickIndex = await selectBestStockImageIndex({
          query: searchQuery,
          candidates: candidates.slice(0, 5),
        }).catch(() => -1);
        if (pickIndex === -1) continue;

        const picked = candidates[pickIndex];
        if (!picked) continue;

        if (provider === "unsplash") {
          return {
            success: true as const,
            source: picked.provider,
            imageUrl: picked.imageUrl,
            attribution: picked.attribution,
          };
        }

        const downloadResponse = await fetch(picked.imageUrl).catch(() => null);
        if (!downloadResponse?.ok) continue;

        const downloadedType =
          downloadResponse.headers.get("content-type") || "image/jpeg";

        const { organizationId, projectId, publicImagesBucket } = args;
        const originalExt = getExtensionFromMimeType(downloadedType);
        const originalKey = getPublicImageUri({
          orgId: organizationId,
          projectId,
          kind: "content-image",
          fileName: `${uuidv7()}.${originalExt}`,
        });
        const stored = await storeOptimizedOrOriginalImage({
          bucket: publicImagesBucket,
          bytes: new Uint8Array(await downloadResponse.arrayBuffer()),
          key: originalKey,
          mimeType: downloadedType,
        });

        if (!stored.ok) {
          console.error(
            `Failed to store ${provider} stock image; trying next provider`,
            stored.error,
          );
          continue;
        }

        return {
          success: true as const,
          source: picked.provider,
          imageUrl: `${apiEnv().SEO_PUBLIC_BUCKET_URL}/${stored.value.key}`,
          attribution: picked.attribution,
        };
      }

      return {
        success: false as const,
        message:
          "No good stock photo found for this query across the configured providers. Try using generate_image or capture_screenshot instead.",
      };
    },
  });

  const captureScreenshotTool = tool({
    description:
      "Capture a rendered screenshot of a given website URL using ScreenshotOne. Blocks ads, cookie banners, and common overlays. Stores the screenshot in the public bucket (optionally optimized to WebP).",
    inputSchema: jsonSchema<typeof screenshotInputSchema.infer>(
      screenshotInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ url, viewportWidth, viewportHeight, fullPage }) {
      const result = await captureScreenshotOne({
        url,
        viewport: {
          width: viewportWidth,
          height: viewportHeight,
        },
        fullPage,
      });

      if (!result.ok) {
        return {
          success: false as const,
          message: result.error.message,
        };
      }
      const { organizationId, projectId, publicImagesBucket } = args;
      const baseId = uuidv7();
      const originalExt = getExtensionFromMimeType(result.value.contentType);
      const originalKey = getPublicImageUri({
        orgId: organizationId,
        projectId,
        kind: "content-image",
        fileName: `${baseId}.${originalExt}`,
      });
      const stored = await storeOptimizedOrOriginalImage({
        bucket: publicImagesBucket,
        bytes: result.value.bytes,
        key: originalKey,
        mimeType: result.value.contentType,
      });

      if (!stored.ok) {
        return {
          success: false as const,
          message: `Screenshot captured, but failed to store it: ${stored.error.message}`,
        };
      }

      return {
        success: true as const,
        screenshot: `${apiEnv().SEO_PUBLIC_BUCKET_URL}/${stored.value.key}`,
      };
    },
    // toModelOutput(result) {
    //   return {
    //     type: "content",
    //     value: [
    //       {
    //         type: "text" as const,
    //         text: result.success ? result.screenshot : result.message,
    //       },
    //       ...(result.screenshot
    //         ? [
    //             {
    //               type: "media" as const,
    //               data: result.screenshot,
    //               mediaType: "image/jpeg",
    //             },
    //           ]
    //         : []),
    //     ],
    //   };
    // },
  });

  const tools = {
    generate_image: generateImage,
    find_stock_image: findStockImage,
    capture_screenshot: captureScreenshotTool,
  } as const;
  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "generate_image",
      toolDescription:
        "Generate a project image based on the project's image settings and a prompt. Helpful for generating a custom image for the project like an infographic, flowchart, or other visual representation.",
      toolInstruction:
        "Provide `prompt` describing the desired image. Use when the user asks for image generation. If image settings are missing, instruct the user to configure image settings first.",
      tool: generateImage,
    },
    {
      toolName: "find_stock_image",
      toolDescription:
        "Find a royalty-free stock image based on a search query. Returns the best match with attribution details. Helpful for finding an image that is relevant to the project's content like of certain objects, places, etc.",
      toolInstruction:
        "Provide `searchQuery` and optionally `orientation` (landscape/portrait/square). Use when you need a royalty-free stock image with source and photographer attribution.",
      tool: findStockImage,
    },
    {
      toolName: "capture_screenshot",
      toolDescription:
        "Capture a rendered screenshot of a given website URL. Helpful for capturing a screenshot of a landing or product page.",
      toolInstruction:
        "Provide `url` to capture a screenshot of. Optionally specify `viewportWidth`, `viewportHeight`, and `fullPage`. This tool is best used when you need to capture a screenshot of a website, normally of a landing or product page.",
      tool: captureScreenshotTool,
    },
  ];

  return { toolDefinitions, tools };
}
