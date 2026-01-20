import type { SeoFileStatus } from "@rectangular-labs/core/schemas/content-parsers";
import { err, ok, safe } from "@rectangular-labs/result";
import {
  and,
  type DB,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  lt,
  schema,
} from "../../client";
import type {
  seoContentDraftInsertSchema,
  seoContentDraftUpdateSchema,
  seoContentInsertSchema,
} from "../../schema/seo";

/**
 * Get the latest published version of content by slug.
 */
export async function getContentBySlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slug: string;
  withContent?: boolean;
}) {
  return await safe(() =>
    args.db.query.seoContent.findFirst({
      columns: args.withContent
        ? undefined
        : { contentMarkdown: false, outline: false, notes: false },
      where: (table, { and, eq, isNull }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          eq(table.slug, args.slug),
          isNull(table.deletedAt),
        ),
      orderBy: (fields, { desc }) => [desc(fields.version)],
    }),
  );
}

/**
 * Get a specific published content version by ID.
 */
export async function getContentById(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  id: string;
  withContent?: boolean;
}) {
  return await safe(() =>
    args.db.query.seoContent.findFirst({
      columns: args.withContent
        ? undefined
        : { contentMarkdown: false, outline: false, notes: false },
      where: (table, { and, eq, isNull }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          eq(table.id, args.id),
          isNull(table.deletedAt),
        ),
    }),
  );
}

/**
 * Get all versions of content by slug (for version history).
 */
export async function getContentVersionsBySlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slug: string;
  withContent?: boolean;
}) {
  return await safe(() =>
    args.db.query.seoContent.findMany({
      columns: args.withContent
        ? undefined
        : { contentMarkdown: false, outline: false, notes: false },
      where: (table, { and, eq, isNull }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          eq(table.slug, args.slug),
          isNull(table.deletedAt),
        ),
      orderBy: (fields, { desc }) => [desc(fields.version)],
    }),
  );
}

/**
 * List all published content (latest version of each slug).
 * Uses a subquery to get the max version for each slug.
 */
export async function listPublishedContent(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  cursor: string | undefined;
  limit: number;
}) {
  return await safe(async () => {
    const latestPerSlug = args.db
      .selectDistinctOn([schema.seoContent.slug], {
        id: schema.seoContent.id,
        organizationId: schema.seoContent.organizationId,
        projectId: schema.seoContent.projectId,
        slug: schema.seoContent.slug,
        version: schema.seoContent.version,
        title: schema.seoContent.title,
        description: schema.seoContent.description,
        heroImage: schema.seoContent.heroImage,
        heroImageCaption: schema.seoContent.heroImageCaption,
        primaryKeyword: schema.seoContent.primaryKeyword,
        articleType: schema.seoContent.articleType,
        publishedAt: schema.seoContent.publishedAt,
        createdAt: schema.seoContent.createdAt,
        updatedAt: schema.seoContent.updatedAt,
        deletedAt: schema.seoContent.deletedAt,
      })
      .from(schema.seoContent)
      .where(
        and(
          eq(schema.seoContent.organizationId, args.organizationId),
          eq(schema.seoContent.projectId, args.projectId),
          isNull(schema.seoContent.deletedAt),
        ),
      )
      .orderBy(schema.seoContent.slug, desc(schema.seoContent.version))
      .as("latest_content");

    const rows = await args.db
      .select()
      .from(latestPerSlug)
      .where(
        args.cursor
          ? lt(latestPerSlug.publishedAt, new Date(args.cursor))
          : undefined,
      )
      .orderBy(desc(latestPerSlug.publishedAt))
      .limit(args.limit);

    return rows;
  });
}

/**
 * Create a new published content version.
 * This should be called when publishing a draft.
 */
export async function createContent(
  db: DB,
  values: typeof seoContentInsertSchema.infer,
) {
  const result = await safe(() =>
    db.insert(schema.seoContent).values(values).returning(),
  );
  if (!result.ok) {
    return result;
  }
  const content = result.value[0];
  if (!content) {
    return err(new Error("Failed to create content"));
  }
  return ok(content);
}

/**
 * Get the next version number for a slug.
 */
export async function getNextVersionForSlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slug: string;
}) {
  const result = await safe(() =>
    args.db.query.seoContent.findFirst({
      columns: { version: true },
      where: (table, { and, eq }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          eq(table.slug, args.slug),
        ),
      orderBy: (fields, { desc }) => [desc(fields.version)],
    }),
  );

  if (!result.ok) return result;
  return ok((result.value?.version ?? 0) + 1);
}

/**
 * Get all scheduled items (drafts with scheduledFor set).
 */
export async function getScheduledItems(args: {
  db: DB;
  organizationId: string;
  projectId: string;
}) {
  return await safe(async () => {
    const now = new Date();
    const draftRows = await args.db.query.seoContentDraft.findMany({
      columns: {
        scheduledFor: true,
      },
      where: (table, { and, eq, isNull, ne, gt }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          gt(table.scheduledFor, now),
          isNull(table.deletedAt),
          ne(table.status, "review-denied"),
          ne(table.status, "suggestion-rejected"),
        ),
    });

    return draftRows.map((row) => ({
      scheduledFor: row.scheduledFor ?? null,
    }));
  });
}

// =============================================================================
// Draft Operations
// =============================================================================

export async function createContentDraft(
  db: DB,
  values: typeof seoContentDraftInsertSchema.infer,
) {
  const result = await safe(() =>
    db.insert(schema.seoContentDraft).values(values).returning(),
  );
  if (!result.ok) {
    return result;
  }
  const draft = result.value[0];
  if (!draft) {
    return err(new Error("Failed to create draft"));
  }
  return ok(draft);
}

export async function updateContentDraft(
  db: DB,
  values: typeof seoContentDraftUpdateSchema.infer & { organizationId: string },
) {
  const result = await safe(() =>
    db
      .update(schema.seoContentDraft)
      .set(values)
      .where(
        and(
          eq(schema.seoContentDraft.id, values.id),
          eq(schema.seoContentDraft.projectId, values.projectId),
          eq(schema.seoContentDraft.organizationId, values.organizationId),
        ),
      )
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  const updatedDraft = result.value[0];
  if (!updatedDraft) {
    return err(new Error("Failed to update draft content."));
  }
  return ok(updatedDraft);
}

export async function hardDeleteDraft(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  id: string;
}) {
  const result = await safe(() =>
    args.db
      .delete(schema.seoContentDraft)
      .where(
        and(
          eq(schema.seoContentDraft.id, args.id),
          eq(schema.seoContentDraft.projectId, args.projectId),
          eq(schema.seoContentDraft.organizationId, args.organizationId),
        ),
      )
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  const deletedDraft = result.value[0];
  if (!deletedDraft) {
    return err(new Error("Failed to hard delete draft"));
  }
  return ok(deletedDraft);
}

/**
 * Get draft by slug. Since there's only one draft per slug, no need for originatingChatId.
 */
export async function getDraftBySlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slug: string;
  withContent?: boolean;
}) {
  return await safe(() =>
    args.db.query.seoContentDraft.findFirst({
      columns: args.withContent
        ? undefined
        : { contentMarkdown: false, outline: false, notes: false },
      where: (table, { and, eq, isNull }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          eq(table.slug, args.slug),
          isNull(table.deletedAt),
        ),
    }),
  );
}

export async function getDraftById(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  id: string;
  withContent?: boolean;
}) {
  return await safe(() =>
    args.db.query.seoContentDraft.findFirst({
      columns: args.withContent
        ? undefined
        : { contentMarkdown: false, outline: false, notes: false },
      where: (table, { and, eq, isNull }) =>
        and(
          eq(table.id, args.id),
          eq(table.projectId, args.projectId),
          eq(table.organizationId, args.organizationId),
          isNull(table.deletedAt),
        ),
    }),
  );
}

/**
 * Get all drafts matching a slug prefix.
 */
export async function getDraftsBySlugPrefix(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slugPrefix: string;
  withContent?: boolean;
}) {
  return await safe(() =>
    args.db.query.seoContentDraft.findMany({
      columns: args.withContent
        ? undefined
        : { contentMarkdown: false, outline: false, notes: false },
      where: (table, { and, eq, isNull, or, like }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          or(
            eq(table.slug, args.slugPrefix),
            like(table.slug, `${args.slugPrefix}%`),
          ),
          isNull(table.deletedAt),
        ),
      orderBy: (fields, { desc }) => [desc(fields.updatedAt), desc(fields.id)],
    }),
  );
}

export async function listDraftsByStatus(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  hasBaseContentId: boolean | null;
  status: SeoFileStatus | readonly SeoFileStatus[];
  cursor: string | undefined;
  limit: number;
}) {
  return await safe(() =>
    args.db.query.seoContentDraft.findMany({
      columns: { contentMarkdown: false, outline: false, notes: false },
      where: (table, { and, eq, inArray, isNull, lt, isNotNull }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          isNull(table.deletedAt),
          args.hasBaseContentId === null
            ? undefined
            : args.hasBaseContentId
              ? isNotNull(table.baseContentId)
              : isNull(table.baseContentId),
          typeof args.status === "string"
            ? eq(table.status, args.status)
            : inArray(table.status, [...args.status]),
          args.cursor ? lt(table.id, args.cursor) : undefined,
        ),
      orderBy: (fields, { desc }) => [desc(fields.id)],
      limit: args.limit,
    }),
  );
}

/**
 * List drafts with full content for export (includes contentMarkdown).
 * Does not paginate - returns all matching drafts.
 */
export async function listDraftsForExport(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  status: SeoFileStatus | readonly SeoFileStatus[];
}) {
  return await safe(() =>
    args.db.query.seoContentDraft.findMany({
      columns: { outline: false, notes: false },
      where: (table, { and, eq, inArray, isNull }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          isNull(table.deletedAt),
          typeof args.status === "string"
            ? eq(table.status, args.status)
            : inArray(table.status, [...args.status]),
        ),
      orderBy: (fields, { desc }) => [desc(fields.id)],
    }),
  );
}

/**
 * List all published content with full content for export (includes contentMarkdown).
 * Does not paginate - returns all published content for the project.
 */
export async function listPublishedContentForExport(args: {
  db: DB;
  organizationId: string;
  projectId: string;
}) {
  return await safe(async () => {
    const latestPerSlug = args.db
      .selectDistinctOn([schema.seoContent.slug], {
        id: schema.seoContent.id,
        organizationId: schema.seoContent.organizationId,
        projectId: schema.seoContent.projectId,
        slug: schema.seoContent.slug,
        version: schema.seoContent.version,
        title: schema.seoContent.title,
        description: schema.seoContent.description,
        heroImage: schema.seoContent.heroImage,
        heroImageCaption: schema.seoContent.heroImageCaption,
        primaryKeyword: schema.seoContent.primaryKeyword,
        articleType: schema.seoContent.articleType,
        contentMarkdown: schema.seoContent.contentMarkdown,
        publishedAt: schema.seoContent.publishedAt,
        createdAt: schema.seoContent.createdAt,
        updatedAt: schema.seoContent.updatedAt,
        deletedAt: schema.seoContent.deletedAt,
      })
      .from(schema.seoContent)
      .where(
        and(
          eq(schema.seoContent.organizationId, args.organizationId),
          eq(schema.seoContent.projectId, args.projectId),
          isNull(schema.seoContent.deletedAt),
        ),
      )
      .orderBy(schema.seoContent.slug, desc(schema.seoContent.version))
      .as("latest_content");

    const rows = await args.db
      .select()
      .from(latestPerSlug)
      .orderBy(desc(latestPerSlug.publishedAt));

    return rows;
  });
}

export async function countDraftsByStatus(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  hasBaseContentId: boolean;
  status: SeoFileStatus | readonly SeoFileStatus[];
}) {
  return await safe(async () => {
    const where = and(
      eq(schema.seoContentDraft.organizationId, args.organizationId),
      eq(schema.seoContentDraft.projectId, args.projectId),
      isNull(schema.seoContentDraft.deletedAt),
      args.hasBaseContentId
        ? isNotNull(schema.seoContentDraft.baseContentId)
        : isNull(schema.seoContentDraft.baseContentId),
      typeof args.status === "string"
        ? eq(schema.seoContentDraft.status, args.status)
        : inArray(schema.seoContentDraft.status, [...args.status]),
    );

    return await args.db.$count(schema.seoContentDraft, where);
  });
}

/**
 * Check if a slug is available for use.
 * A slug is unavailable if:
 * - There's published content with that slug
 * - There's an active draft (not rejected/denied) with that slug
 */
export async function validateSlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slug: string;
  ignoreContentId: string | undefined;
  ignoreDraftId: string | undefined;
}) {
  const [publishedResult, draftResult] = await Promise.all([
    // Check if published content exists with this slug
    safe(() =>
      args.db.query.seoContent.findFirst({
        columns: { id: true },
        where: (table, { and, eq, ne }) =>
          and(
            eq(table.organizationId, args.organizationId),
            eq(table.projectId, args.projectId),
            eq(table.slug, args.slug),
            args.ignoreContentId
              ? ne(table.id, args.ignoreContentId)
              : undefined,
          ),
      }),
    ),
    // Check if active draft exists with this slug
    safe(() =>
      args.db.query.seoContentDraft.findFirst({
        columns: { id: true },
        where: (table, { and, eq, isNull, ne, notInArray }) =>
          and(
            eq(table.organizationId, args.organizationId),
            eq(table.projectId, args.projectId),
            eq(table.slug, args.slug),
            isNull(table.deletedAt),
            notInArray(table.status, ["suggestion-rejected", "review-denied"]),
            args.ignoreDraftId ? ne(table.id, args.ignoreDraftId) : undefined,
          ),
      }),
    ),
  ]);

  if (!publishedResult.ok) return publishedResult;
  if (!draftResult.ok) return draftResult;

  if (publishedResult.value) {
    return ok({
      valid: false as const,
      slug: args.slug,
      reason: "conflicts-with-published-content" as const,
    });
  }

  if (draftResult.value) {
    return ok({
      valid: false as const,
      slug: args.slug,
      reason: "conflicts-with-draft" as const,
    });
  }

  return ok({
    valid: true as const,
    slug: args.slug,
  });
}
