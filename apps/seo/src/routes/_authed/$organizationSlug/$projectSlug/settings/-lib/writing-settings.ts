import {
  authorSettingsSchema,
  writingSettingsSchema,
} from "@rectangular-labs/db/parsers";
import { type } from "arktype";

export const WritingSettingFormSchema = writingSettingsSchema.merge(
  type({
    authors: authorSettingsSchema.array(),
  }),
);

export type WritingSettingFormSchema = typeof WritingSettingFormSchema.infer;
