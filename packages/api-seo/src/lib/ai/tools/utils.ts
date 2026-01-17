import type { ToolSet } from "ai";

export interface AgentToolDefinition {
  toolName: string;
  toolDescription: string;
  toolInstruction: string;
  callDirect?: boolean;
  tool: ToolSet[string];
}

export function formatToolSkillsSection(
  definitions: readonly AgentToolDefinition[],
): string {
  const lines = definitions.map((d) => `- ${d.toolName}: ${d.toolDescription}`);
  return lines.length > 0 ? lines.join("\n") : "- (no tools available)";
}
