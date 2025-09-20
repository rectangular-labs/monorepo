import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { smKeyword } from "../mention/keyword-schema";
import { smProject } from "../mention/project-schema";

// Pages discovered/crawled from a site
export const seoPage = pgSeoTable(
  "page",
  {
    id: uuid("seo_page_id").primaryKey().$defaultFn(uuidv7),
    projectId: uuid()
      .notNull()
      .references(() => smProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    url: text().notNull(),
    canonicalUrl: text(),
    title: text(),
    description: text(),
    contentText: text(),
    contentHtml: text(),
    contentMarkdown: text(),
    extractor: text(), // defuddle | selector
    httpStatus: integer(),
    robotsNoindex: boolean(),
    robotsNofollow: boolean(),
    sitemapPriority: numeric({ precision: 2, scale: 1 }),
    status: text().notNull().default("discovered"), // discovered|crawled|parsed|indexed
    lastCrawledAt: timestamp({ mode: "date", withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("seo_page_project_url_unique").on(table.projectId, table.url),
    index("seo_page_project_idx").on(table.projectId),
    index("seo_page_status_idx").on(table.status),
  ],
);

export const seoPageRelations = relations(seoPage, ({ one, many }) => ({
  project: one(smProject, {
    fields: [seoPage.projectId],
    references: [smProject.id],
  }),
  pageKeywords: many(seoPageKeyword),
}));

export const seoPageInsertSchema = createInsertSchema(seoPage);
export const seoPageSelectSchema = createSelectSchema(seoPage);
export const seoPageUpdateSchema = createUpdateSchema(seoPage);

// Link pages to keywords with optional primary flag and match score
export const seoPageKeyword = pgSeoTable(
  "page_keyword",
  {
    id: uuid("seo_page_keyword_id").primaryKey().$defaultFn(uuidv7),
    pageId: uuid()
      .notNull()
      .references(() => seoPage.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    keywordId: uuid()
      .notNull()
      .references(() => smKeyword.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    isPrimary: boolean().notNull().default(false),
    matchScore: numeric({ precision: 4, scale: 3 }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("seo_page_keyword_unique").on(table.pageId, table.keywordId),
    index("seo_page_keyword_page_idx").on(table.pageId),
    index("seo_page_keyword_keyword_idx").on(table.keywordId),
  ],
);

export const seoPageKeywordRelations = relations(seoPageKeyword, ({ one }) => ({
  page: one(seoPage, {
    fields: [seoPageKeyword.pageId],
    references: [seoPage.id],
  }),
  keyword: one(smKeyword, {
    fields: [seoPageKeyword.keywordId],
    references: [smKeyword.id],
  }),
}));

export const seoPageKeywordInsertSchema = createInsertSchema(seoPageKeyword);
export const seoPageKeywordSelectSchema = createSelectSchema(seoPageKeyword);
export const seoPageKeywordUpdateSchema = createUpdateSchema(seoPageKeyword);

// Keyword clusters for grouping related phrases
export const seoKeywordCluster = pgSeoTable(
  "keyword_cluster",
  {
    id: uuid("seo_keyword_cluster_id").primaryKey().$defaultFn(uuidv7),
    projectId: uuid()
      .notNull()
      .references(() => smProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    name: text().notNull(),
    method: text(), // heuristic|embedding|manual
    centroidKeywordId: uuid().references(() => smKeyword.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    ...timestamps,
  },
  (table) => [index("seo_keyword_cluster_project_idx").on(table.projectId)],
);

export const seoKeywordClusterRelations = relations(
  seoKeywordCluster,
  ({ one, many }) => ({
    project: one(smProject, {
      fields: [seoKeywordCluster.projectId],
      references: [smProject.id],
    }),
    members: many(seoKeywordClusterMember),
  }),
);

export const seoKeywordClusterInsertSchema =
  createInsertSchema(seoKeywordCluster);
export const seoKeywordClusterSelectSchema =
  createSelectSchema(seoKeywordCluster);
export const seoKeywordClusterUpdateSchema =
  createUpdateSchema(seoKeywordCluster);

export const seoKeywordClusterMember = pgSeoTable(
  "keyword_cluster_member",
  {
    id: uuid("seo_keyword_cluster_member_id").primaryKey().$defaultFn(uuidv7),
    clusterId: uuid()
      .notNull()
      .references(() => seoKeywordCluster.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    keywordId: uuid()
      .notNull()
      .references(() => smKeyword.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("seo_keyword_cluster_member_unique").on(
      table.clusterId,
      table.keywordId,
    ),
    index("seo_keyword_cluster_member_cluster_idx").on(table.clusterId),
  ],
);

export const seoKeywordClusterMemberRelations = relations(
  seoKeywordClusterMember,
  ({ one }) => ({
    cluster: one(seoKeywordCluster, {
      fields: [seoKeywordClusterMember.clusterId],
      references: [seoKeywordCluster.id],
    }),
    keyword: one(smKeyword, {
      fields: [seoKeywordClusterMember.keywordId],
      references: [smKeyword.id],
    }),
  }),
);

export const seoKeywordClusterMemberInsertSchema = createInsertSchema(
  seoKeywordClusterMember,
);
export const seoKeywordClusterMemberSelectSchema = createSelectSchema(
  seoKeywordClusterMember,
);
export const seoKeywordClusterMemberUpdateSchema = createUpdateSchema(
  seoKeywordClusterMember,
);

// Campaign proposals before approval
export const seoCampaignProposal = pgSeoTable(
  "campaign_proposal",
  {
    id: uuid("seo_campaign_proposal_id").primaryKey().$defaultFn(uuidv7),
    projectId: uuid()
      .notNull()
      .references(() => smProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    title: text().notNull(),
    thesis: text(),
    whyFiveWs: jsonb().$type<{
      what?: string;
      why?: string;
      who?: string;
      when?: string;
      where?: string;
    }>(),
    explanationTechnical: text(),
    explanationLayman: text(),
    baselineMetrics: jsonb().$type<Record<string, unknown>>(),
    status: text().notNull().default("pending"), // pending|approved|rejected|draft
    requestedBy: text(),
    approvedAt: timestamp({ mode: "date", withTimezone: true }),
    rejectedAt: timestamp({ mode: "date", withTimezone: true }),
    rejectionReason: text(),
    ...timestamps,
  },
  (table) => [index("seo_campaign_proposal_project_idx").on(table.projectId)],
);

export const seoCampaignProposalRelations = relations(
  seoCampaignProposal,
  ({ one, many }) => ({
    project: one(smProject, {
      fields: [seoCampaignProposal.projectId],
      references: [smProject.id],
    }),
    campaigns: many(seoCampaign),
  }),
);

export const seoCampaignProposalInsertSchema =
  createInsertSchema(seoCampaignProposal);
export const seoCampaignProposalSelectSchema =
  createSelectSchema(seoCampaignProposal);
export const seoCampaignProposalUpdateSchema =
  createUpdateSchema(seoCampaignProposal);

// Approved campaigns with tasks and schedule
export const seoCampaign = pgSeoTable(
  "campaign",
  {
    id: uuid("seo_campaign_id").primaryKey().$defaultFn(uuidv7),
    projectId: uuid()
      .notNull()
      .references(() => smProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    proposalId: uuid().references(() => seoCampaignProposal.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    title: text().notNull(),
    thesis: text(),
    status: text().notNull().default("planned"), // planned|active|paused|completed|canceled
    startDate: timestamp({ mode: "date", withTimezone: true }),
    endDate: timestamp({ mode: "date", withTimezone: true }),
    goalMetrics: jsonb().$type<Record<string, unknown>>(),
    schedule: jsonb().$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [
    index("seo_campaign_project_idx").on(table.projectId),
    index("seo_campaign_status_idx").on(table.status),
  ],
);

export const seoCampaignRelations = relations(seoCampaign, ({ one, many }) => ({
  project: one(smProject, {
    fields: [seoCampaign.projectId],
    references: [smProject.id],
  }),
  proposal: one(seoCampaignProposal, {
    fields: [seoCampaign.proposalId],
    references: [seoCampaignProposal.id],
  }),
  tasks: many(seoCampaignTask),
  events: many(seoCalendarEvent),
}));

export const seoCampaignInsertSchema = createInsertSchema(seoCampaign);
export const seoCampaignSelectSchema = createSelectSchema(seoCampaign);
export const seoCampaignUpdateSchema = createUpdateSchema(seoCampaign);

// Individual tasks within a campaign
export const seoCampaignTask = pgSeoTable(
  "campaign_task",
  {
    id: uuid("seo_campaign_task_id").primaryKey().$defaultFn(uuidv7),
    campaignId: uuid()
      .notNull()
      .references(() => seoCampaign.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    type: text().notNull(), // audit|brief|update|internal_linking|publish|other
    status: text().notNull().default("todo"), // todo|in_progress|done|blocked|canceled
    title: text(),
    targetPageId: uuid().references(() => seoPage.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    targetKeywordId: uuid().references(() => smKeyword.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    dueAt: timestamp({ mode: "date", withTimezone: true }),
    payload: jsonb().$type<Record<string, unknown>>(),
    result: jsonb().$type<Record<string, unknown>>(),
    assigneeId: text(),
    ...timestamps,
  },
  (table) => [
    index("seo_campaign_task_campaign_idx").on(table.campaignId),
    index("seo_campaign_task_status_idx").on(table.status),
  ],
);

export const seoCampaignTaskRelations = relations(
  seoCampaignTask,
  ({ one }) => ({
    campaign: one(seoCampaign, {
      fields: [seoCampaignTask.campaignId],
      references: [seoCampaign.id],
    }),
    page: one(seoPage, {
      fields: [seoCampaignTask.targetPageId],
      references: [seoPage.id],
    }),
    keyword: one(smKeyword, {
      fields: [seoCampaignTask.targetKeywordId],
      references: [smKeyword.id],
    }),
  }),
);

export const seoCampaignTaskInsertSchema = createInsertSchema(seoCampaignTask);
export const seoCampaignTaskSelectSchema = createSelectSchema(seoCampaignTask);
export const seoCampaignTaskUpdateSchema = createUpdateSchema(seoCampaignTask);

// Calendar events for scheduling
export const seoCalendarEvent = pgSeoTable(
  "calendar_event",
  {
    id: uuid("seo_calendar_event_id").primaryKey().$defaultFn(uuidv7),
    projectId: uuid()
      .notNull()
      .references(() => smProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    campaignId: uuid().references(() => seoCampaign.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    taskId: uuid().references(() => seoCampaignTask.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    title: text().notNull(),
    startAt: timestamp({ mode: "date", withTimezone: true }).notNull(),
    endAt: timestamp({ mode: "date", withTimezone: true }),
    status: text().notNull().default("scheduled"), // scheduled|done|canceled
    metadata: jsonb().$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [index("seo_calendar_event_project_idx").on(table.projectId)],
);

export const seoCalendarEventRelations = relations(
  seoCalendarEvent,
  ({ one }) => ({
    project: one(smProject, {
      fields: [seoCalendarEvent.projectId],
      references: [smProject.id],
    }),
    campaign: one(seoCampaign, {
      fields: [seoCalendarEvent.campaignId],
      references: [seoCampaign.id],
    }),
    task: one(seoCampaignTask, {
      fields: [seoCalendarEvent.taskId],
      references: [seoCampaignTask.id],
    }),
  }),
);

export const seoCalendarEventInsertSchema =
  createInsertSchema(seoCalendarEvent);
export const seoCalendarEventSelectSchema =
  createSelectSchema(seoCalendarEvent);
export const seoCalendarEventUpdateSchema =
  createUpdateSchema(seoCalendarEvent);

// Audit snapshots and metric thresholds
export const seoAuditSnapshot = pgSeoTable(
  "audit_snapshot",
  {
    id: uuid("seo_audit_snapshot_id").primaryKey().$defaultFn(uuidv7),
    projectId: uuid()
      .notNull()
      .references(() => smProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    pageId: uuid().references(() => seoPage.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    keywordId: uuid().references(() => smKeyword.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    capturedAt: timestamp({ mode: "date", withTimezone: true }).notNull(),
    overallScore: numeric({ precision: 5, scale: 2 }),
    status: text().notNull().default("ok"), // ok|warning|critical
    metrics: jsonb().$type<Record<string, unknown>>().notNull(),
    explanationTechnical: text(),
    explanationLayman: text(),
    ...timestamps,
  },
  (table) => [
    index("seo_audit_snapshot_project_idx").on(table.projectId),
    index("seo_audit_snapshot_captured_idx").on(table.capturedAt),
  ],
);

export const seoAuditSnapshotRelations = relations(
  seoAuditSnapshot,
  ({ one }) => ({
    project: one(smProject, {
      fields: [seoAuditSnapshot.projectId],
      references: [smProject.id],
    }),
    page: one(seoPage, {
      fields: [seoAuditSnapshot.pageId],
      references: [seoPage.id],
    }),
    keyword: one(smKeyword, {
      fields: [seoAuditSnapshot.keywordId],
      references: [smKeyword.id],
    }),
  }),
);

export const seoAuditSnapshotInsertSchema =
  createInsertSchema(seoAuditSnapshot);
export const seoAuditSnapshotSelectSchema =
  createSelectSchema(seoAuditSnapshot);
export const seoAuditSnapshotUpdateSchema =
  createUpdateSchema(seoAuditSnapshot);

export const seoMetricThreshold = pgSeoTable(
  "metric_threshold",
  {
    id: uuid("seo_metric_threshold_id").primaryKey().$defaultFn(uuidv7),
    metricKey: text().notNull(), // e.g., ranking_position, content_quality
    direction: text().notNull(), // higher_is_better | lower_is_better
    goodThreshold: numeric({ precision: 10, scale: 3 }),
    badThreshold: numeric({ precision: 10, scale: 3 }),
    notes: text(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("seo_metric_threshold_metric_unique").on(table.metricKey),
  ],
);

export const seoMetricThresholdInsertSchema =
  createInsertSchema(seoMetricThreshold);
export const seoMetricThresholdSelectSchema =
  createSelectSchema(seoMetricThreshold);
export const seoMetricThresholdUpdateSchema =
  createUpdateSchema(seoMetricThreshold);

// Integrations
export const seoCmsConnection = pgSeoTable(
  "cms_connection",
  {
    id: uuid("seo_cms_connection_id").primaryKey().$defaultFn(uuidv7),
    projectId: uuid()
      .notNull()
      .references(() => smProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    provider: text().notNull(), // webflow
    externalSiteId: text(),
    status: text().notNull().default("disconnected"), // disconnected|connected|errored
    config: jsonb().$type<Record<string, unknown>>(),
    lastSyncedAt: timestamp({ mode: "date", withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("seo_cms_connection_project_idx").on(table.projectId)],
);

export const seoCmsConnectionInsertSchema =
  createInsertSchema(seoCmsConnection);
export const seoCmsConnectionSelectSchema =
  createSelectSchema(seoCmsConnection);
export const seoCmsConnectionUpdateSchema =
  createUpdateSchema(seoCmsConnection);

export const seoPublishingJob = pgSeoTable(
  "publishing_job",
  {
    id: uuid("seo_publishing_job_id").primaryKey().$defaultFn(uuidv7),
    projectId: uuid()
      .notNull()
      .references(() => smProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    cmsConnectionId: uuid().references(() => seoCmsConnection.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    taskId: uuid().references(() => seoCampaignTask.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    targetPageId: uuid().references(() => seoPage.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    status: text().notNull().default("enqueued"), // enqueued|running|succeeded|failed|canceled
    payload: jsonb().$type<Record<string, unknown>>(),
    externalJobId: text(),
    errorMessage: text(),
    startedAt: timestamp({ mode: "date", withTimezone: true }),
    finishedAt: timestamp({ mode: "date", withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("seo_publishing_job_project_idx").on(table.projectId)],
);

export const seoPublishingJobInsertSchema =
  createInsertSchema(seoPublishingJob);
export const seoPublishingJobSelectSchema =
  createSelectSchema(seoPublishingJob);
export const seoPublishingJobUpdateSchema =
  createUpdateSchema(seoPublishingJob);

// Sitemap sources per project
export const seoSitemapSource = pgSeoTable(
  "sitemap_source",
  {
    id: uuid("seo_sitemap_source_id").primaryKey().$defaultFn(uuidv7),
    projectId: uuid()
      .notNull()
      .references(() => smProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    url: text().notNull(),
    status: text().notNull().default("active"), // active|disabled|errored
    lastFetchedAt: timestamp({ mode: "date", withTimezone: true }),
    lastFetchError: text(),
    discoveredCount: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("seo_sitemap_source_project_url_unique").on(
      table.projectId,
      table.url,
    ),
  ],
);

export const seoSitemapSourceInsertSchema =
  createInsertSchema(seoSitemapSource);
export const seoSitemapSourceSelectSchema =
  createSelectSchema(seoSitemapSource);
export const seoSitemapSourceUpdateSchema =
  createUpdateSchema(seoSitemapSource);
