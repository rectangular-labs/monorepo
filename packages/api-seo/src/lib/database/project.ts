import { type DBTransaction, schema } from "@rectangular-labs/db";
import {
  getSeoProjectAuthorsByProjectId,
  getSeoProjectByIdentifierAndOrgId,
} from "@rectangular-labs/db/operations";
import { err, ok, safe } from "@rectangular-labs/result";
import { getContext } from "../../context";
import type { ChatContext } from "../../types";

export async function upsertProject(
  values: typeof schema.seoProjectInsertSchema.infer & {
    organizationId: string;
  },
  tx?: DBTransaction,
) {
  const db = tx ?? (await getContext()).db;
  const projectResult = await safe(() =>
    db
      .insert(schema.seoProject)
      .values({
        organizationId: values.organizationId,
        websiteUrl: values.websiteUrl,
      })
      .onConflictDoNothing({
        target: [
          schema.seoProject.organizationId,
          schema.seoProject.websiteUrl,
        ],
      })
      .returning(),
  );
  if (!projectResult.ok) {
    return projectResult;
  }
  const insertedProject = projectResult.value[0];
  if (insertedProject) {
    return ok(insertedProject);
  }
  const existingProject = await db.query.seoProject.findFirst({
    where: (table, { eq, and }) =>
      and(
        eq(table.organizationId, values.organizationId),
        eq(table.websiteUrl, values.websiteUrl),
      ),
  });
  if (!existingProject) {
    return err(new Error("Failed to create project"));
  }
  return ok(existingProject);
}

export async function getProjectInChat(args: {
  context: ChatContext;
  includeAuthors?: boolean;
}) {
  const { context, includeAuthors } = args;
  if (context.cache.project) {
    if (includeAuthors && !context.cache.project?.authors) {
      const authorsResult = await getSeoProjectAuthorsByProjectId(
        context.db,
        context.projectId,
      );
      if (!authorsResult.ok) {
        return authorsResult;
      }
      context.cache.project.authors = authorsResult.value;
    }
    return ok(context.cache.project);
  }
  const projectResult = await getSeoProjectByIdentifierAndOrgId(
    context.db,
    context.projectId,
    context.organizationId,
    {
      businessBackground: true,
      imageSettings: true,
      writingSettings: true,
      publishingSettings: true,
    },
  );
  if (!projectResult.ok) {
    return projectResult;
  }
  if (!projectResult.value) {
    return ok(null);
  }

  context.cache.project = projectResult.value;
  if (includeAuthors && !context.cache.project?.authors) {
    const authorsResult = await getSeoProjectAuthorsByProjectId(
      context.db,
      context.projectId,
    );
    if (!authorsResult.ok) {
      return authorsResult;
    }
    context.cache.project.authors = authorsResult.value;
  }
  return ok(context.cache.project);
}
