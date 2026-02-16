import { openai } from "@ai-sdk/openai";
import { uuidv7 } from "@rectangular-labs/db";
import { generateText, stepCountIs, tool } from "ai";
import { type } from "arktype";
import type { AgentToolDefinition } from "./utils";

function findSkillDefinition({
  skill,
  toolDefinitions,
}: {
  skill: string;
  toolDefinitions: readonly AgentToolDefinition[];
}): AgentToolDefinition | undefined {
  return toolDefinitions.find((d) => d.toolName === skill);
}

function generateMissingSkillResponse({
  skill,
  toolDefinitions,
}: {
  skill: string;
  toolDefinitions: readonly AgentToolDefinition[];
}) {
  const known = toolDefinitions.map((d) => d.toolName).sort();
  return {
    success: false,
    message: [
      `Skill "${skill}" not found.`,
      "",
      "Known skills:",
      known.length > 0 ? known.map((k) => `- ${k}`).join("\n") : "- (none)",
    ].join("\n"),
  } as const;
}

const readSkillsInputSchema = type({
  skill: type("string").describe(
    "The name of the skill you want instructions for.",
  ),
});
const useSkillsInputSchema = type({
  taskName: type("string").describe(
    "The name of the task that encompasses what the current skill is trying to achieve. Should be short and descriptive.",
  ),
  skill: type("string").describe("The name of the skill you want to use."),
  instructions: type("string").describe("The instructions for the skill."),
});

export function createSkillTools({
  toolDefinitions,
}: {
  toolDefinitions: readonly AgentToolDefinition[];
}) {
  const readSkills = tool({
    description:
      "Read usage instructions for a given skill. Returns guidance on how to best use the skill.",
    inputSchema: readSkillsInputSchema,
    async execute({ skill }) {
      const skillDefinition = findSkillDefinition({ skill, toolDefinitions });
      if (!skillDefinition) {
        return generateMissingSkillResponse({ skill, toolDefinitions });
      }

      return await Promise.resolve({
        success: true,
        usageInstructions: [
          `## Skill: ${skillDefinition.toolName}`,
          "",
          "### How to use it",
          skillDefinition.toolInstruction,
        ].join("\n"),
      });
    },
  });

  const useSkills = tool({
    description:
      "Use a given skill. Returns the result of the skill execution.",
    inputSchema: useSkillsInputSchema,
    async execute({ skill, instructions }) {
      const skillDefinition = findSkillDefinition({ skill, toolDefinitions });
      if (!skillDefinition) {
        return generateMissingSkillResponse({ skill, toolDefinitions });
      }

      console.log({
        skillName: skillDefinition.toolName,
        skillInstruction: instructions,
      });

      if (skillDefinition.callDirect === true) {
        const result = await skillDefinition.tool.execute?.(
          { instructions },
          {
            toolCallId: uuidv7(),
            messages: [],
          },
        );
        // note casting here for now since the tool response is not typed
        return result as { success: true; result: string };
      }

      const { text } = await generateText({
        model: openai("gpt-5.2"),
        prompt: `Use the ${skillDefinition.toolName} tool to perform the task:
${instructions}

For the response, simply output the result of the task and include any failures and/or results from executing the task.`,
        tools: {
          [skillDefinition.toolName]: skillDefinition.tool,
        },
        onStepFinish: (step) => {
          console.log("skill step", step);
        },
        stopWhen: [stepCountIs(15)],
      });
      console.log("skill response text", text);
      return {
        success: true,
        result: text,
      };
    },
  });

  return {
    read_skills: readSkills,
    use_skills: useSkills,
  } as const;
}
