import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { apiEnv } from "../env";

export interface GenerateReplyOptions {
  prompt: string;
  system?: string | undefined;
  temperature?: number | undefined;
  model?: string | undefined;
}

export async function generateReply(
  options: GenerateReplyOptions,
): Promise<string> {
  const env = apiEnv();
  const modelId = options.model ?? env.AI_MODEL ?? "gemini-2.5-flash";
  const { text } = await generateText({
    model: google(modelId),
    prompt: options.prompt,
    ...(options.system ? { system: options.system } : {}),
    ...(options.temperature !== undefined
      ? { temperature: options.temperature }
      : {}),
  });
  return text.trim();
}
