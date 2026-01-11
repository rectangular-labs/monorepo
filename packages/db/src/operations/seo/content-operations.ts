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
  withMarkdownContent?: boolean;
}) {
  return await safe(() =>
    args.db.query.seoContent.findFirst({
      columns: args.withMarkdownContent
        ? undefined
        : { contentMarkdown: false },
      where: (table, { and, eq }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          eq(table.slug, args.slug),
          eq(table.isLiveVersion, true),
        ),
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
}) {
  return await safe(() =>
    args.db.query.seoContentDraft.findFirst({
      where: (table, { and, eq, isNull }) =>
        and(
          eq(table.organizationId, args.organizationId),
          eq(table.projectId, args.projectId),
          eq(table.slug, args.slug),
          args.originatingChatId
            ? eq(table.originatingChatId, args.originatingChatId)
            : isNull(table.originatingChatId),
        ),
      orderBy: (fields, { desc }) => [desc(fields.updatedAt), desc(fields.id)],
    }),
  );
}
