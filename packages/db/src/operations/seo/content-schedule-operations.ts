import { err, ok, safe } from "@rectangular-labs/result";
import { and, type DB, eq, isNull, schema } from "../../client";
import type {
  seoContentScheduleInsertSchema,
  seoContentScheduleUpdateSchema,
} from "../../schema/seo";

export async function createContentSchedule(
  db: DB,
  values: typeof seoContentScheduleInsertSchema.infer & {
    organizationId: string;
  },
) {
  const result = await safe(() =>
    db.insert(schema.seoContentSchedule).values(values).returning(),
  );
  if (!result.ok) {
    return result;
  }
  const schedule = result.value[0];
  if (!schedule) {
    return err(new Error("Failed to create content schedule"));
  }
  return ok(schedule);
}

export async function getContentScheduleById(args: {
  db: DB;
  id: string;
  projectId: string;
  contentId: string;
}) {
  return await safe(() =>
    args.db.query.seoContentSchedule.findFirst({
      where: (table, { and, eq, isNull }) =>
        and(
          eq(table.id, args.id),
          eq(table.projectId, args.projectId),
          eq(table.contentId, args.contentId),
          isNull(table.deletedAt),
        ),
    }),
  );
}

export async function updateContentSchedule(
  db: DB,
  values: typeof seoContentScheduleUpdateSchema.infer & { organizationId: string },
) {
  const result = await safe(() =>
    db
      .update(schema.seoContentSchedule)
      .set(values)
      .where(
        and(
          eq(schema.seoContentSchedule.id, values.id),
          eq(schema.seoContentSchedule.projectId, values.projectId),
          eq(schema.seoContentSchedule.contentId, values.contentId),
          eq(schema.seoContentSchedule.organizationId, values.organizationId),
          isNull(schema.seoContentSchedule.deletedAt),
        ),
      )
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  const updatedSchedule = result.value[0];
  if (!updatedSchedule) {
    return err(new Error("Failed to update content schedule"));
  }
  return ok(updatedSchedule);
}
