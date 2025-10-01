import { type } from "arktype";
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
import type {
  campaignTypeSchema,
  contentCategorySchema,
  contentTypeSchema,
  statusSchema,
} from "../../schema-parsers/content-campaign";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { organization } from "../auth-schema";
import { seoContentCampaignSearchKeyword } from "./content-campaign-search-keywords-schema";
import { seoProject } from "./project-schema";

export const seoContentCampaign = pgSeoTable(
  "content_campaign",
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

    // Campaign metadata
    campaignType: text({
      enum: [
        "improvement",
        "new-content",
      ] satisfies (typeof campaignTypeSchema.infer)[] as [string, ...string[]],
    }).notNull(),
    status: text({
      enum: [
        "analyzing",
        "new",
        "ready",
        "generating-content",
        "content-ready",
      ] satisfies (typeof statusSchema.infer)[] as [string, ...string[]],
    })
      .notNull()
      .default("analyzing"),
    targetArticleCount: integer(),
    impactScore: numeric({ precision: 10, scale: 2 }),

    serpSnapshot: jsonb().$type<{
      fetchedAt: string;
      provider: "dataforseo";
      topResults: {
        type: "paid" | "organic";
        position: number;
        url: string;
        title: string;
        description?: string;
        contentType?: typeof contentTypeSchema.infer;
      }[];
    }>(),

    // Content strategy
    proposedFormat: text({
      enum: [
        "blog",
        "listicle",
        "guide",
        "comparison",
        "how-to",
        "checklist",
        "case-study",
        "other",
      ] satisfies (typeof contentTypeSchema.infer)[] as [string, ...string[]],
    }),
    contentCategory: text({
      enum: [
        "money-page",
        "authority-builder",
        "quick-win",
      ] satisfies (typeof contentCategorySchema.infer)[] as [
        string,
        ...string[],
      ],
    }),

    ...timestamps,
  },
  (table) => [
    index("seo_content_campaign_organization_idx").on(table.organizationId),
    index("seo_content_campaign_project_idx").on(table.projectId),
  ],
);

export const seoContentCampaignRelations = relations(
  seoContentCampaign,
  ({ one, many }) => ({
    project: one(seoProject, {
      fields: [seoContentCampaign.projectId],
      references: [seoProject.id],
    }),
    organization: one(organization, {
      fields: [seoContentCampaign.organizationId],
      references: [organization.id],
    }),
    searchKeywordsMap: many(seoContentCampaignSearchKeyword),
  }),
);

export const seoContentCampaignInsertSchema = createInsertSchema(
  seoContentCampaign,
).omit("id", "createdAt", "updatedAt");
export const seoContentCampaignSelectSchema =
  createSelectSchema(seoContentCampaign);
export const seoContentCampaignUpdateSchema = createUpdateSchema(
  seoContentCampaign,
)
  .omit("createdAt", "updatedAt")
  .merge(type({ id: "string.uuid" }));
