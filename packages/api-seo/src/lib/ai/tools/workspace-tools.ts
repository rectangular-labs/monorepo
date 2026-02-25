/** Workspace toolkit factory — settings + planner. */
import type { DB } from "@rectangular-labs/db";
import { createAskQuestionsTool } from "./workspace-tools.ask-question-tool";
import { createDataAccessTools } from "./workspace-tools.data-access-tool";
import { createSettingsTools } from "./workspace-tools.settings-tools";

/**
 * Create all workspace-related tools.
 *
 * Tools included:
 * - `ask_questions` — Ask the user structured questions
 * - `manage_settings` — Display or update project settings
 * - `manage_integrations` — Help manage integrations
 * - `list_existing_data` — List strategies or content drafts
 * - `search_existing_data` — Search strategies or content drafts
 * - `read_existing_data` — Read strategy or content draft
 * - `update_existing_strategy` — Update strategy or content draft
 * - `update_existing_content_draft` — Update strategy or content draft
 * - `delete_existing_data` — Delete strategy or content draft
 */
export function createWorkspaceTools(ctx: {
  db: DB;
  organizationId: string;
  projectId: string;
}) {
  const plannerTools = createAskQuestionsTool();
  const dataAccessTools = createDataAccessTools({
    db: ctx.db,
    organizationId: ctx.organizationId,
    projectId: ctx.projectId,
  });
  const settingsTools = createSettingsTools({
    context: {
      db: ctx.db,
      projectId: ctx.projectId,
      organizationId: ctx.organizationId,
    },
  });

  const tools = {
    ...plannerTools.tools,
    ...settingsTools.tools,
    ...dataAccessTools.tools,
  } as const;
  return { tools };
}
