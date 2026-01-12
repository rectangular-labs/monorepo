import type { DB, schema } from "@rectangular-labs/db";
import {
  getContentBySlug,
  getDraftBySlug,
} from "@rectangular-labs/db/operations";
import { err, ok, type Result } from "@rectangular-labs/result";

export async function getContentForSlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slug: string;
  originatingChatId: string | null;
  withContent?: boolean;
}): Promise<
  Result<
    {
      data:
        | {
            source: "draft";
            content: typeof schema.seoContentDraft.$inferSelect;
          }
        | { source: "live"; content: typeof schema.seoContent.$inferSelect };
      deleted: boolean;
    },
    Error
  >
> {
  const draftResult = await getDraftBySlug(args);
  if (!draftResult.ok) {
    return draftResult;
  }
  const draft = draftResult.value;
  if (draft) {
    return ok({
      data: { source: "draft", content: draft },
      deleted: draft.status === "deleted",
    });
  }

  const liveResult = await getContentBySlug({
    ...args,
    contentType: "live",
  });
  if (!liveResult.ok) {
    return liveResult;
  }
  const live = liveResult.value;
  if (!live) {
    return err(new Error(`Slug ${args.slug} not found`));
  }
  return ok({
    data: { source: "live", content: live },
    deleted: false,
  });
}
