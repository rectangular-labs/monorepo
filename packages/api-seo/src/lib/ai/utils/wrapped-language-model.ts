import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { addToolInputExamplesMiddleware, wrapLanguageModel } from "ai";

/**
 * OpenAI and Gemini do not natively consume tool input examples.
 * We inject examples through middleware so tool usage is more reliable.
 */
function withToolInputExamples(
  model: Parameters<typeof wrapLanguageModel>[0]["model"],
): ReturnType<typeof wrapLanguageModel> {
  return wrapLanguageModel({
    model,
    middleware: addToolInputExamplesMiddleware(),
  });
}

export function wrappedOpenAI(
  modelId: Parameters<typeof openai>[0],
): ReturnType<typeof wrapLanguageModel> {
  return withToolInputExamples(openai(modelId));
}

export function wrappedGoogle(
  modelId: Parameters<typeof google>[0],
): ReturnType<typeof wrapLanguageModel> {
  return withToolInputExamples(google(modelId));
}
