import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  numeric,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { user } from "../auth-schema";
import { seoProject } from "./project-schema";

export const seoTaskRun = pgSeoTable(
  "task_run",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    projectId: uuid()
      .notNull()
      .references(() => seoProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    requestedBy: text()
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    taskId: text().notNull(),
    provider: text({ enum: ["trigger.dev", "cloudflare"] })
      .notNull()
      .default("trigger.dev"),
    inputData: jsonb().notNull().$type<
      | {
          type: "site-understanding";
          siteUrl: string;
        }
      | {
          type: "topic-clusters";
          keywordCategory: string;
        }
    >(),
    costInCents: numeric({
      mode: "string",
      precision: 10,
      scale: 5,
    })
      .notNull()
      .default("0.00000"),
    durationMs: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("seo_task_run_project_idx").on(table.projectId),
    index("seo_task_run_task_id_idx").on(table.taskId),
    index("seo_task_run_provider_idx").on(table.provider),
    index("seo_task_run_requested_by_idx").on(table.requestedBy),
  ],
);

export const seoTaskRunRelations = relations(seoTaskRun, ({ one }) => ({
  user: one(user, {
    fields: [seoTaskRun.requestedBy],
    references: [user.id],
  }),
  project: one(seoProject, {
    fields: [seoTaskRun.projectId],
    references: [seoProject.id],
  }),
}));

export const seoTaskRunInsertSchema = createInsertSchema(seoTaskRun);
export const seoTaskRunUpdateSchema = createUpdateSchema(seoTaskRun);
export const seoTaskRunSelectSchema = createSelectSchema(seoTaskRun);
