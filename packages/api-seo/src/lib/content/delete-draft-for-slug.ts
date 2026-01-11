import type { DB } from "@rectangular-labs/db";
import { updateContentDraft } from "@rectangular-labs/db/operations";
import { ok, type Result } from "@rectangular-labs/result";
import { ensureDraftForSlug } from "./ensure-draft-for-slug";
import { getContentForSlug } from "./get-content-for-slug";

export async function deleteDraftForSlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slug: string;
  originatingChatId: string | null;
  userId: string | null;
}): Promise<Result<{ success: true }, Error>> {
  const contentResult = await getContentForSlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug: args.slug,
    originatingChatId: args.originatingChatId,
    withContent: false,
  });

  if (!contentResult.ok) {
    return contentResult;
  }

  const { data } = contentResult.value;

  let draftContentId = data.content.id;
  if (data.source === "live") {
    const draftResult = await ensureDraftForSlug({
      db: args.db,
      organizationId: args.organizationId,
      projectId: args.projectId,
      slug: args.slug,
      originatingChatId: args.originatingChatId,
      userId: args.userId,
      primaryKeyword: data.content.primaryKeyword,
    });
    if (!draftResult.ok) {
      return draftResult;
    }
    draftContentId = draftResult.value.draft.id;
  }

  // data.source must be "draft"
  const updated = await updateContentDraft(args.db, {
    id: draftContentId,
    projectId: args.projectId,
    organizationId: args.organizationId,
    status: "deleted",
  });
  if (!updated.ok) {
    return updated;
  }
  return ok({ success: true });
}
