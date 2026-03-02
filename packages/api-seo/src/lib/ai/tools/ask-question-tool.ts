import { jsonSchema, tool } from "ai";

export function createAskQuestionsTool() {
  const askQuestions = tool({
    description:
      'Ask the user clarification questions to help provide clarity to the request. Returns immediately while waiting for the user\'s response. By default the "other" option is always added to each question so you can omit that option from the options array.',
    inputSchema: jsonSchema<{
      questions: {
        id: string;
        prompt: string;
        options: {
          id: string;
          label: string;
        }[];
        allow_multiple?: boolean;
      }[];
    }>({
      type: "object",
      additionalProperties: false,
      required: ["questions"],
      properties: {
        questions: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "prompt", "options"],
            properties: {
              id: {
                type: "string",
                description: "Unique identifier for the question.",
              },
              prompt: {
                type: "string",
                description: "The question to ask the user.",
              },
              options: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["id", "label"],
                  properties: {
                    id: {
                      type: "string",
                      description: "Unique identifier for the option.",
                    },
                    label: {
                      type: "string",
                      description: "Label for the option shown to the user.",
                    },
                  },
                },
              },
              allow_multiple: {
                type: "boolean",
                description:
                  "Whether to allow selecting multiple options for this question.",
              },
            },
          },
        },
      },
    }),
    inputExamples: [
      {
        input: {
          questions: [
            {
              id: "target_audience",
              prompt: "Who is the article for?",
              options: [
                { id: "beginners", label: "Beginners" },
                { id: "technical", label: "Technical practitioners" },
              ],
            },
          ],
        },
      },
      {
        input: {
          questions: [
            {
              id: "channels",
              prompt: "Which channels should we prioritize?",
              options: [
                { id: "seo", label: "SEO" },
                { id: "social", label: "Social" },
                { id: "email", label: "Email" },
              ],
              allow_multiple: true,
            },
          ],
        },
      },
    ],
    async execute() {
      return await Promise.resolve({
        success: true,
        message: "Questions posted. Pending user response.",
      });
    },
  });

  const tools = { ask_questions: askQuestions } as const;
  return { tools };
}
