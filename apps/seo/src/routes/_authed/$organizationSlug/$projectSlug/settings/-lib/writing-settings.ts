import {
  authorSettingsSchema,
  writingSettingsSchema,
} from "@rectangular-labs/core/schemas/project-parsers";
import { type } from "arktype";

export const WritingSettingFormSchema = writingSettingsSchema.merge(
  type({
    authors: authorSettingsSchema.array(),
  }),
);

export type WritingSettingFormSchema = typeof WritingSettingFormSchema.infer;
