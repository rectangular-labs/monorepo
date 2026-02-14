import type {
  imageSettingsSchema,
  publishingSettingsSchema,
  writingSettingsSchema,
} from "@rectangular-labs/core/schemas/project-parsers";
import {
  DEFAULT_BRAND_VOICE,
  DEFAULT_USER_INSTRUCTIONS,
} from "./workflow.constant";

export const DRAFT_NOT_FOUND_ERROR_MESSAGE = "Draft not found.";
export const SLUG_NOT_AVAILABLE_ERROR_MESSAGE = "Slug is not available.";

export const DEFAULT_WRITING_SETTINGS: typeof writingSettingsSchema.infer = {
  version: "v1",
  brandVoice: DEFAULT_BRAND_VOICE,
  customInstructions: DEFAULT_USER_INSTRUCTIONS,
};

export const DEFAULT_PUBLISHING_SETTINGS: typeof publishingSettingsSchema.infer =
  {
    version: "v1",
    requireContentReview: false,
    requireSuggestionReview: false,
    participateInLinkExchange: true,
  };

export const DEFAULT_IMAGE_SETTINGS: typeof imageSettingsSchema.infer = {
  version: "v1",
  styleReferences: [],
  brandLogos: [],
  imageInstructions: "",
  stockImageProviders: ["pixabay", "unsplash", "pexels"],
};
