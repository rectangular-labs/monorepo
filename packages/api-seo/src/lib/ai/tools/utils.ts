import type { ToolSet } from "ai";

type AnyTool = ToolSet[string];
export interface AgentToolDefinition {
  toolName: string;
  toolDescription: string;
  toolInstruction: string;
  tool: AnyTool;
}

export function toolDefinitionsToToolSet(
  definitions: readonly AgentToolDefinition[],
): ToolSet {
  const tools: Record<string, AnyTool> = {};
  for (const def of definitions) {
    tools[def.toolName] = def.tool;
  }
  return tools;
}

export function formatToolSkillsSection(
  definitions: readonly AgentToolDefinition[],
): string {
  const lines = definitions.map((d) => `- ${d.toolName}: ${d.toolDescription}`);
  return lines.length > 0 ? lines.join("\n") : "- (no tools available)";
}
