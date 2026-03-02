import type { schema } from "@rectangular-labs/db";
import { formatBusinessBackground } from "./format-business-background";

/**
 * Build the standard project context block used in system prompts.
 * Consolidates the project context formatting that was inline in each agent.
 */
export function buildProjectContext(
  project: Pick<
    typeof schema.seoProject.$inferSelect,
    "websiteUrl" | "name" | "businessBackground"
  >,
): string[] {
  const utcDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
  return [
    `- Today's date: ${utcDate} (UTC timezone)`,
    `- Project name: ${project.name ?? "(none)"}`,
    `- Website: ${project.websiteUrl}
    ${formatBusinessBackground(project.businessBackground)}`,
  ];
}
