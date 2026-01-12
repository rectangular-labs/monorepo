import type { DB } from "@rectangular-labs/db";
import { and, eq, schema } from "@rectangular-labs/db";
import {
  getContentBySlug,
  getDraftBySlug,
} from "@rectangular-labs/db/operations";
import { err, ok, type Result } from "@rectangular-labs/result";
import { getContentForSlug } from "./get-content-for-slug";

// TODO(review): figure out if this implementation makes sense
export async function moveDraftSlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  fromSlug: string;
  toSlug: string;
  originatingChatId: string | null;
  userId: string | null;
}): Promise<Result<{ success: true }, Error>> {
  const existingDestinationResult = await getContentForSlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug: args.toSlug,
    originatingChatId: args.originatingChatId,
    withContent: false,
  });
  if (!existingDestinationResult.ok) {
    return existingDestinationResult;
  }
  const existingDestination = existingDestinationResult.value;
  if (existingDestination) {
    if (
      existingDestination.data.source === "draft" &&
      existingDestination.data.content.status === "deleted"
    ) {
      return err(
        new Error("Destination draft exists but is marked as deleted."),
      );
    }
    await args.db
      .delete(schema.seoContentDraft)
      .where(
        and(
          eq(schema.seoContentDraft.id, existingDestination.data.content.id),
          eq(schema.seoContentDraft.organizationId, args.organizationId),
          eq(schema.seoContentDraft.projectId, args.projectId),
        ),
      );
  }

  const existingSourceResult = await getDraftBySlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug: args.fromSlug,
    originatingChatId: args.originatingChatId,
  });
  if (!existingSourceResult.ok) {
    return existingSourceResult;
  }
  const existingSource = existingSourceResult.value;
  if (existingSource) {
    if (existingSource.status === "deleted") {
      return err(new Error("Source draft is marked as deleted."));
    }
    const [updated] = await args.db
      .update(schema.seoContentDraft)
      .set({ slug: args.toSlug })
      .where(
        and(
          eq(schema.seoContentDraft.id, existingSource.id),
          eq(schema.seoContentDraft.organizationId, args.organizationId),
          eq(schema.seoContentDraft.projectId, args.projectId),
        ),
      )
      .returning();
    if (!updated) {
      return err(new Error("Failed to move draft."));
    }
    return ok({ success: true });
  }

  const liveResult = await getContentBySlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug: args.fromSlug,
    contentType: "live",
    withContent: true,
  });
  if (!liveResult.ok) {
    return err(
      liveResult.error instanceof Error
        ? liveResult.error
        : new Error("Failed to load source content."),
    );
  }
  const live = liveResult.value;
  if (!live) {
    return err(new Error("Source content not found."));
  }

  const [draft] = await args.db
    .insert(schema.seoContentDraft)
    .values({
      organizationId: args.organizationId,
      projectId: args.projectId,
      baseContentId: live.id,
      originatingChatId: args.originatingChatId ?? null,
      createdByUserId: args.userId ?? null,
      title: live.title,
      description: live.description,
      slug: args.toSlug,
      primaryKeyword: live.primaryKeyword,
      notes: live.notes,
      outlineGeneratedByTaskRunId: live.outlineGeneratedByTaskRunId,
      outline: live.outline,
      generatedByTaskRunId: live.generatedByTaskRunId,
      articleType: live.articleType,
      contentMarkdown: live.contentMarkdown,
    })
    .returning();
  if (!draft) {
    return err(new Error("Failed to create moved draft."));
  }
  return ok({ success: true });
}
