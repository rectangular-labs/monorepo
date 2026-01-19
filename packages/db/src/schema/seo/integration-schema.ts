import {
  INTEGRATION_PROVIDERS,
  INTEGRATION_STATUSES,
} from "@rectangular-labs/core/schemas/integration-config";
import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { account, organization } from "../auth-schema";
import { seoProject } from "./project-schema";

export const seoIntegration = pgSeoTable(
  "integration",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    organizationId: text()
      .notNull()
      .references(() => organization.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    projectId: uuid()
      .notNull()
      .references(() => seoProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    // For OAuth-based integrations (GitHub, GSC)
    accountId: text().references(() => account.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    isDefault: boolean().default(false),
    provider: text({ enum: INTEGRATION_PROVIDERS }).notNull(),
    name: text().notNull(),
    status: text({ enum: INTEGRATION_STATUSES })
      .notNull()
      .default("pending_setup"),
    lastError: text(),
    lastUsedAt: timestamp({ mode: "date", withTimezone: true }),
    // Encrypted JSON corresponding to integrationConfigSchema - application layer encrypts/decrypts
    encryptedConfig: text().notNull(),
    ...timestamps,
  },
  (table) => [
    index("seo_integration_project_idx").on(table.projectId),
    index("seo_integration_org_project_provider_idx").on(
      table.organizationId,
      table.projectId,
      table.provider,
    ),
    index("seo_integration_account_idx").on(table.accountId),
    unique("seo_integration_project_provider_name_unique").on(
      table.projectId,
      table.provider,
      table.name,
    ),
  ],
);

export const seoIntegrationRelations = relations(seoIntegration, ({ one }) => ({
  organization: one(organization, {
    fields: [seoIntegration.organizationId],
    references: [organization.id],
  }),
  project: one(seoProject, {
    fields: [seoIntegration.projectId],
    references: [seoProject.id],
  }),
  account: one(account, {
    fields: [seoIntegration.accountId],
    references: [account.id],
  }),
}));

export const seoIntegrationInsertSchema = createInsertSchema(
  seoIntegration,
).omit("id", "createdAt", "updatedAt", "deletedAt");
export const seoIntegrationSelectSchema = createSelectSchema(seoIntegration);
export const seoIntegrationUpdateSchema = createUpdateSchema(seoIntegration)
  .omit("createdAt", "updatedAt", "organizationId", "projectId")
  .merge(
    type({
      id: "string.uuid",
      organizationId: "string",
      projectId: "string.uuid",
    }),
  );
