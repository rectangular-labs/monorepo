import { err, ok } from "@rectangular-labs/result";
import { getContext } from "../context-storage";

export async function getProjectById(projectId: string, orgId: string) {
  const context = await getContext();
  const project = await context.db.query.smProject.findFirst({
    where: (table, { eq, and }) =>
      and(eq(table.id, projectId), eq(table.organizationId, orgId)),
  });
  if (!project) return err(new Error("Project not found"));
  return ok(project);
}
