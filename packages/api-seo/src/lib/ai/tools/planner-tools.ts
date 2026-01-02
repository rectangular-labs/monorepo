import { type JSONSchema7, jsonSchema, tool } from "ai";
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

const createPlanInputSchema = type({
  "name?": "string",
  "overview?": "string",
  plan: "string",
  "todos?": type({
    id: "string",
    content: "string",
    "dependencies?": "string[]",
  }).array(),
  "old_str?": "string",
  "new_str?": "string",
});

export function createPlannerToolsWithMetadata() {
  const askQuestions = tool({
    description:
      "Ask the user clarification questions to help provide clarity to the request. Returns immediately while waiting for the user's response.",
    inputSchema: jsonSchema<typeof askQuestionInputSchema.infer>(
      askQuestionInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute() {
      return await Promise.resolve({
        success: true,
        message: "Questions posted. Pending user response.",
      });
    },
  });

  const createPlan = tool({
    description:
      "Create or update a plan artifact for the SEO/GEO task (overview + steps/todos).",
    inputSchema: jsonSchema<typeof createPlanInputSchema.infer>(
      createPlanInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute() {
      return await Promise.resolve({
        success: true,
        message: "Plan created/updated",
      });
    },
  });

  const tools = {
    ask_questions: askQuestions,
    create_plan: createPlan,
  } as const;

  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "ask_questions",
      toolDescription:
        "Ask the user structured follow-up questions (multiple choice) and pause for an answer.",
      toolInstruction:
        "Use when missing info would materially change the approach. Provide 1-6 questions. Each question needs an id, prompt, and options[] (id+label). Set allow_multiple=true only if multiple selections are valid. Keep questions crisp and decision-driving.",
      tool: askQuestions,
    },
    {
      toolName: "create_plan",
      toolDescription:
        "Publish a structured plan artifact (overview + step-by-step plan + optional todos with dependencies).",
      toolInstruction:
        "Use for larger/multi-step work. Provide: plan (markdown), optional name/overview, and optional todos[] with ids and dependencies. Only include old_str/new_str when proposing a text diff-style transformation.",
      tool: createPlan,
    },
  ];

  return { toolDefinitions, tools };
}
