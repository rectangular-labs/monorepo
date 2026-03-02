import { type GoogleGenerativeAIProviderOptions, google } from "@ai-sdk/google";
import { getExtensionFromMimeType } from "@rectangular-labs/core/project/get-extension-from-mimetype";
import type { imageSettingsSchema } from "@rectangular-labs/core/schemas/project-parsers";
import { uuidv7 } from "@rectangular-labs/db";
import { generateText, jsonSchema, Output, tool } from "ai";
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

function normalizeImageMediaType(mediaType: string | null | undefined): string {
  const normalized = mediaType?.split(";")[0]?.trim().toLowerCase();
  switch (normalized) {
    case "image/jpg":
      return "image/jpeg";
    case "image/jpeg":
    case "image/png":
    case "image/gif":
    case "image/webp":
      return normalized;
    default:
      return "image/jpeg";
  }
}

async function selectBestStockImageIndex(args: {
  query: string;
  candidates: StockImageCandidate[];
}): Promise<number> {
  const selectionSchema = type({ index: "number.integer >= -1" });
  const { output } = await generateText({
    model: google("gemini-3-flash-preview"),
    output: Output.object({
      schema: selectionSchema,
    }),
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

  const index = output.index;
  if (index < -1 || index >= args.candidates.length) return -1;
  return index;
}

export function createImageTools(args: {
  organizationId: string;
  projectId: string;
  imageSettings: typeof imageSettingsSchema.infer | null;
  publicImagesBucket: InitialContext["publicImagesBucket"];
}) {
  const generateImage = tool({
    description:
      "Generate a project image based on the project's image settings and a prompt. Use for custom visuals like infographics, diagrams, and conceptual hero images.",
    inputSchema: jsonSchema<{
      prompt: string;
    }>({
      type: "object",
      additionalProperties: false,
      required: ["prompt"],
      properties: {
        prompt: {
          type: "string",
          description: "The prompt to generate an image for.",
        },
      },
    }),
    inputExamples: [
      {
        input: {
          prompt:
            "A clean isometric diagram of an invoice automation workflow with OCR, validation, and ERP sync.",
        },
      },
      {
        input: {
          prompt:
            "Minimal flat vector hero image showing a marketing analytics dashboard and trend lines.",
        },
      },
    ],
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
        const originalContentType = normalizeImageMediaType(file.mediaType);

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
  });

  const findStockImage = tool({
    description:
      "Find a royalty-free stock image based on a search query. Returns the best match with attribution details. You must put the attribution as the image caption.",
    inputSchema: jsonSchema<{
      searchQuery: string;
      orientation?: "landscape" | "portrait" | "square";
    }>({
      type: "object",
      additionalProperties: false,
      required: ["searchQuery"],
      properties: {
        searchQuery: {
          type: "string",
          description: "The search query describing the desired image.",
        },
        orientation: {
          type: "string",
          enum: ["landscape", "portrait", "square"],
          default: "landscape",
          description: "The orientation of the image to search for.",
        },
      },
    }),
    inputExamples: [
      {
        input: {
          searchQuery: "team collaborating around a laptop in office",
          orientation: "landscape",
        },
      },
      {
        input: {
          searchQuery: "city skyline at sunrise",
          orientation: "portrait",
        },
      },
    ],
    execute: async ({ searchQuery, orientation = "landscape" }) => {
      const providers = args.imageSettings?.stockImageProviders ?? [
        "pixabay",
        "unsplash",
        "pexels",
      ];

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
          orientation,
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

        const downloadedType = normalizeImageMediaType(
          downloadResponse.headers.get("content-type"),
        );

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
    inputSchema: jsonSchema<{
      url: string;
      viewportWidth?: number;
      viewportHeight?: number;
    }>({
      type: "object",
      additionalProperties: false,
      required: ["url"],
      properties: {
        url: {
          type: "string",
          description:
            "The URL to capture a screenshot of. Must be a valid URL.",
        },
        viewportWidth: {
          type: "integer",
          minimum: 480,
          default: 1280,
          description: "Viewport width for the screenshot.",
        },
        viewportHeight: {
          type: "integer",
          minimum: 480,
          default: 720,
          description: "Viewport height for the screenshot.",
        },
      },
    }),
    inputExamples: [
      {
        input: {
          url: "https://example.com",
        },
      },
      {
        input: {
          url: "https://example.com/pricing",
          viewportWidth: 1440,
          viewportHeight: 900,
        },
      },
    ],
    async execute({ url, viewportWidth = 1280, viewportHeight = 720 }) {
      const result = await captureScreenshotOne({
        url,
        viewport: {
          width: viewportWidth,
          height: viewportHeight,
        },
        fullPage: false,
      });

      if (!result.ok) {
        return {
          success: false as const,
          message: result.error.message,
        };
      }
      const { organizationId, projectId, publicImagesBucket } = args;
      const baseId = uuidv7();
      const screenshotMediaType = normalizeImageMediaType(
        result.value.contentType,
      );

      const originalExt = getExtensionFromMimeType(screenshotMediaType);
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
        mimeType: screenshotMediaType,
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
  });

  const tools = {
    generate_image: generateImage,
    find_stock_image: findStockImage,
    capture_screenshot: captureScreenshotTool,
  } as const;
  return { tools };
}
