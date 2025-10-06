import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, text, unique, uuid } from "drizzle-orm/pg-core";
import type {
  seoGscPermissionLevelSchema,
  seoGscPropertyTypeSchema,
} from "../../schema-parsers";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { account } from "../auth-schema";
import { seoProject } from "./project-schema";

export const seoGscProperty = pgSeoTable(
  "gsc_property",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    accountId: text()
      .notNull()
      .references(() => account.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    domain: text().notNull(), // e.g., "https://example.com/" or "example.com"
    type: text("type", {
      enum: [
        "URL_PREFIX",
        "DOMAIN",
      ] as const satisfies (typeof seoGscPropertyTypeSchema.infer)[],
    }).notNull(),
    permissionLevel: text("permission_level", {
      enum: [
        "write",
        "read-only",
        "needs-verification",
      ] as const satisfies (typeof seoGscPermissionLevelSchema.infer)[],
    }).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("seo_gsc_property_domain_account_id_unique").on(
      table.domain,
      table.accountId,
    ),
    index("seo_gsc_property_account_id_idx").on(table.accountId),
    index("seo_gsc_property_domain_idx").on(table.domain),
  ],
);

export const seoGscPropertyRelations = relations(
  seoGscProperty,
  ({ one, many }) => ({
    account: one(account, {
      fields: [seoGscProperty.accountId],
      references: [account.id],
    }),
    projects: many(seoProject),
  }),
);

export const seoGscPropertyInsertSchema = createInsertSchema(
  seoGscProperty,
).omit("id", "createdAt", "updatedAt");
export const seoGscPropertySelectSchema = createSelectSchema(seoGscProperty);
export const seoGscPropertyUpdateSchema = createUpdateSchema(seoGscProperty)
  .omit("createdAt", "updatedAt")
  .merge(type({ id: "string.uuid" }));
