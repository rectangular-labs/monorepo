import { tool } from "ai";
import { type } from "arktype";
import type { AgentToolDefinition } from "./utils";

const askQuestionInputSchema = type({
  questions: type({
    id: type("string").describe("Unique identifier for the question."),
    prompt: type("string").describe("The question to ask the user."),
    options: type({
      id: type("string").describe("Unique identifier for the option."),
      label: type("string").describe(
        "Label for the option in respond to the question prompt",
      ),
    }).array(),
    "allow_multiple?": type("boolean").describe(
      "Whether to allow the user to select multiple options in respond to the question prompt",
    ),
  }).array(),
});

export function createPlannerToolsWithMetadata() {
  const askQuestions = tool({
    description:
      'Ask the user clarification questions to help provide clarity to the request. Returns immediately while waiting for the user\'s response. By default the "other" option is always added to each question so you can omit that option from the options array.',
    inputSchema: askQuestionInputSchema,
    async execute() {
      return await Promise.resolve({
        success: true,
        message: "Questions posted. Pending user response.",
      });
    },
  });

  const tools = { ask_questions: askQuestions } as const;

  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "ask_questions",
      toolDescription:
        "Ask the user structured follow-up questions (multiple choice) and pause for an answer.",
      toolInstruction:
        "Use when missing info would materially change the approach. Provide 1-6 questions. Each question needs an id, prompt, and options[] (id+label). Set allow_multiple=true only if multiple selections are valid. Keep questions crisp and decision-driving.",
      tool: askQuestions,
    },
  ];

  return { toolDefinitions, tools };
}
