import { google } from "@ai-sdk/google";
import { ok, safe } from "@rectangular-labs/result";
import { generateText } from "ai";

export const DEFAULT_SYSTEM_PROMPT = `You are an expert community manager. You are given a post and you need to generate a reply to the post. Your goal is to be maximally helpful to the author of the post.`;

export async function generateReply({
  mentionContent,
  systemPrompt,
}: {
  mentionContent: string;
  systemPrompt: string | null;
}) {
  // TODO: add env to allow for different models without changing code
  const modelId = "gemini-2.5-flash";
  const finalPrompt = systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  const generationResult = await safe(() =>
    generateText({
      model: google(modelId),
      prompt: mentionContent,
      system: finalPrompt,
    }),
  );
  if (!generationResult.ok) {
    return generationResult;
  }
  const { text } = generationResult.value;
  return ok({
    text: text.trim(),
    modelId,
  });
}
