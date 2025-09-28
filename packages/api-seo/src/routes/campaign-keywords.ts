import { ORPCError } from "@orpc/client";
import { schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { withOrganizationIdBase } from "../context";
import { upsertKeyword } from "../lib/database/keywords";
import { getProjectByIdentifier } from "../lib/database/project";
import { validateOrganizationMiddleware } from "../lib/validate-organization";

const generate = withOrganizationIdBase
  .route({ method: "POST", path: "/{campaignId}/generate-clusters" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string",
      campaignId: "string",
      category: "string",
      "seeds?": type({
        short: type("string").array(),
        medium: type("string").array(),
        long: type("string").array(),
      }).or(type.undefined),
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      taskId: "string",
    }),
  )
  .handler(async ({ context, input }) => {
    const project = await getProjectByIdentifier(
      input.projectId,
      context.organization.id,
    );
    if (!project.ok) {
      throw new ORPCError("BAD_REQUEST", { message: project.error.message });
    }

    return {
      taskId: "123",
    };
  });

const confirm = withOrganizationIdBase
  .route({ method: "POST", path: "/{campaignId}/confirm-clusters" })
  .input(
    type({
      projectId: "string",
      campaignId: "string",
      keywords: type({
        phrase: "string",
        bucket: "'short'|'medium'|'long'",
      }).array(),
    }),
  )
  .output(type({ inserted: type("number"), skipped: type("number") }))
  .handler(async ({ context, input }) => {
    const project = await getProjectByIdentifier(
      input.projectId,
      context.session.activeOrganizationId,
    );
    if (!project.ok) {
      throw new ORPCError("BAD_REQUEST", { message: project.error.message });
    }

    let inserted = 0;
    let skipped = 0;
    for (const kw of input.keywords) {
      const upsert = await upsertKeyword(kw.phrase);
      if (!upsert.ok) {
        skipped++;
        continue;
      }
      const keyword = upsert.value;
      const [row] = await context.db
        .insert(schema.seoContentCampaignKeyword)
        .values({
          campaignId: input.campaignId,
          keywordId: keyword.id,
          bucket: kw.bucket,
          status: "pending",
        })
        .onConflictDoNothing({
          target: [
            schema.seoContentCampaignKeyword.campaignId,
            schema.seoContentCampaignKeyword.keywordId,
          ],
        })
        .returning();
      if (row) inserted++;
      else skipped++;
    }
    return { inserted, skipped };
  });

export default withOrganizationIdBase
  .prefix("/organization/{organizationIdentifier}/project/{projectId}/campaign")
  .router({ generate, confirm });
