import type { SeoFileStatus } from "@rectangular-labs/core/schemas/content-parsers";
import { err, ok, safe } from "@rectangular-labs/result";
import { and, type DB, eq, schema } from "../../client";
import type {
  seoContentDraftInsertSchema,
  seoContentDraftUpdateSchema,
  seoContentInsertSchema,
  seoContentUpdateSchema,
} from "../../schema/seo";

export async function getContentBySlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slug: string;
  contentType: "live" | "latest";
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
          args.contentType === "live"
            ? eq(table.isLiveVersion, true)
            : undefined,
          isNull(table.deletedAt),
        ),
      orderBy: (fields, { desc }) => [desc(fields.version)],
    }),
  );
}

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

export async function getContentsBySlug(args: {
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
      where: (table, { and, eq, or, like, isNull }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          or(eq(table.slug, args.slug), like(table.slug, `${args.slug}%`)),
          eq(table.isLiveVersion, true),
          isNull(table.deletedAt),
        ),
      orderBy: (fields, { desc }) => [desc(fields.updatedAt), desc(fields.id)],
    }),
  );
}

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

export async function updateContent(
  db: DB,
  values: typeof seoContentUpdateSchema.infer,
) {
  const result = await safe(() =>
    db
      .update(schema.seoContent)
      .set(values)
      .where(
        and(
          eq(schema.seoContent.id, values.id),
          eq(schema.seoContent.projectId, values.projectId),
          eq(schema.seoContent.organizationId, values.organizationId),
        ),
      )
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  const updatedContent = result.value[0];
  if (!updatedContent) {
    return err(new Error("Failed to update content"));
  }
  return ok(updatedContent);
}

export async function listContentWithLatestSchedule(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  cursor: string | undefined;
  limit: number;
}) {
  return await safe(async () => {
    const contentRows = await args.db.query.seoContent.findMany({
      columns: { contentMarkdown: false, outline: false, notes: false },
      where: (table, { and, eq, isNull, lt }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          eq(table.isLiveVersion, true),
          isNull(table.deletedAt),
          args.cursor ? lt(table.id, args.cursor) : undefined,
        ),
      with: {
        schedules: {
          where: (table, { isNull }) => isNull(table.deletedAt),
          orderBy: (fields, { desc }) => [
            desc(fields.scheduledFor),
            desc(fields.id),
          ],
          limit: 1,
        },
      },
      orderBy: (fields, { desc }) => [desc(fields.id)],
      limit: args.limit,
    });
    return contentRows.map((content) => {
      const schedule = content.schedules[0];
      if (!schedule) {
        throw new Error("No schedule found for content");
      }
      return {
        ...content,
        schedule,
      };
    });
  });
}

export async function getScheduledItems(args: {
  db: DB;
  organizationId: string;
  projectId: string;
}) {
  const scheduledRows = await args.db.query.seoContentSchedule.findMany({
    columns: {
      scheduledFor: true,
    },
    where: (table, { and, eq, isNull }) =>
      and(
        eq(table.organizationId, args.organizationId),
        eq(table.projectId, args.projectId),
        isNull(table.deletedAt),
      ),
  });

  const draftRows = await args.db.query.seoContentDraft.findMany({
    columns: {
      targetReleaseDate: true,
    },
    where: (table, { and, eq, isNull, ne, isNotNull }) =>
      and(
        eq(table.organizationId, args.organizationId),
        eq(table.projectId, args.projectId),
        isNotNull(table.targetReleaseDate),
        isNull(table.deletedAt),
        ne(table.status, "deleted"),
        ne(table.status, "review-denied"),
        ne(table.status, "suggestion-rejected"),
      ),
  });

  const scheduledItems = [
    ...scheduledRows.map((row) => ({
      scheduledFor: row.scheduledFor ?? null,
    })),
    ...draftRows.map((row) => ({
      scheduledFor: row.targetReleaseDate ?? null,
    })),
  ];

  return scheduledItems;
}

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

export async function getDraftBySlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slug: string;
  originatingChatId?: string | null;
  withContent?: boolean;
}) {
  return await safe(() =>
    args.db.query.seoContentDraft.findFirst({
      columns: args.withContent
        ? undefined
        : { contentMarkdown: false, outline: false, notes: false },
      where: (table, { and, eq }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          args.originatingChatId
            ? eq(table.originatingChatId, args.originatingChatId)
            : undefined,
          eq(table.slug, args.slug),
        ),
      orderBy: (fields, { desc }) => [desc(fields.updatedAt), desc(fields.id)],
    }),
  );
}

export async function getDraftById(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  id: string;
  originatingChatId?: string | null;
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
          args.originatingChatId
            ? eq(table.originatingChatId, args.originatingChatId)
            : undefined,
          eq(table.id, args.id),
          isNull(table.deletedAt),
        ),
    }),
  );
}

export async function getDraftsBySlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slug: string;
  originatingChatId: string | null;
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
          args.originatingChatId
            ? eq(table.originatingChatId, args.originatingChatId)
            : undefined,
          or(eq(table.slug, args.slug), like(table.slug, `${args.slug}%`)),
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
  hasBaseContentId: boolean;
  status: SeoFileStatus | readonly SeoFileStatus[];
  cursor: string | undefined;
  limit: number;
}) {
  return await safe(() =>
    args.db.query.seoContentDraft.findMany({
      columns: { contentMarkdown: false, outline: false, notes: false },
      where: (table, { and, eq, inArray, isNotNull, isNull, lt }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          isNull(table.deletedAt),
          args.hasBaseContentId
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

export async function validateSlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slug: string;
  ignoreDraftId?: string;
  ignoreLiveContentId?: string;
}) {
  // for live query we want to see if the slug matches any of the live content that we are not branching off from.
  // for draft query we want to see if the slug matches any of the drafts that is for new content (draft for updates to existing content will be covered by the live query).
  const [liveResult, draftResult] = await Promise.all([
    safe(() =>
      args.db.query.seoContent.findFirst({
        columns: { id: true },
        where: (table, { and, eq, isNull, ne }) =>
          and(
            eq(table.organizationId, args.organizationId),
            eq(table.projectId, args.projectId),
            eq(table.slug, args.slug),
            eq(table.isLiveVersion, true),
            isNull(table.deletedAt),
            args.ignoreLiveContentId
              ? ne(table.id, args.ignoreLiveContentId)
              : undefined,
          ),
      }),
    ),
    safe(() =>
      args.db.query.seoContentDraft.findFirst({
        columns: { id: true },
        where: (table, { and, eq, isNull, ne, notInArray }) =>
          and(
            eq(table.organizationId, args.organizationId),
            eq(table.projectId, args.projectId),
            eq(table.slug, args.slug),
            isNull(table.deletedAt),
            isNull(table.baseContentId),
            notInArray(table.status, [
              "deleted",
              "suggestion-rejected",
              "review-denied",
            ]),
            args.ignoreDraftId ? ne(table.id, args.ignoreDraftId) : undefined,
          ),
      }),
    ),
  ]);

  if (!liveResult.ok) return liveResult;
  if (!draftResult.ok) return draftResult;

  if (liveResult.value) {
    return ok({
      valid: false as const,
      slug: args.slug,
      reason: "conflicts-with-live-content" as const,
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
