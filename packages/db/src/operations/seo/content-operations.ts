import { err, ok, safe } from "@rectangular-labs/result";
import { and, type DB, eq, schema } from "../../client";
import type {
  seoContentDraftInsertSchema,
  seoContentDraftUpdateSchema,
  seoContentUpdateSchema,
} from "../../schema/seo";

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
          eq(table.isLiveVersion, true),
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

export async function updateContentDraft(
  db: DB,
  values: typeof seoContentDraftUpdateSchema.infer,
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
      where: (table, { and, eq, isNull }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          args.originatingChatId
            ? eq(table.originatingChatId, args.originatingChatId)
            : isNull(table.originatingChatId),
          eq(table.slug, args.slug),
        ),
      orderBy: (fields, { desc }) => [desc(fields.updatedAt), desc(fields.id)],
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
            : isNull(table.originatingChatId),
          or(eq(table.slug, args.slug), like(table.slug, `${args.slug}%`)),
        ),
      orderBy: (fields, { desc }) => [desc(fields.updatedAt), desc(fields.id)],
    }),
  );
}
