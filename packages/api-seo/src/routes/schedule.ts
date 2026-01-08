import { ORPCError } from "@orpc/server";
import { contentStatusSchema } from "@rectangular-labs/core/schemas/content-parsers";
import { and, eq, schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { withOrganizationIdBase } from "../context";

const list = withOrganizationIdBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      projectId: "string",
      "status?": contentStatusSchema.extract("'scheduled'|'published'"),
    }),
  )
  .output(
    type({
      data: schema.seoContentScheduleSelectSchema.array(),
    }),
  )
  .handler(async ({ context, input }) => {
    const schedules = await context.db.query.seoContentSchedule.findMany({
      where: (table, { and, eq }) =>
        and(
          eq(table.projectId, input.projectId),
          eq(table.organizationId, context.session.activeOrganizationId),
          input.status ? eq(table.status, input.status) : undefined,
        ),
      orderBy: (fields, { desc }) => [
        desc(fields.scheduledFor),
        desc(fields.id),
      ],
    });

    return { data: schedules };
  });

const get = withOrganizationIdBase
  .route({ method: "GET", path: "/{id}" })
  .input(type({ id: "string", projectId: "string", contentId: "string" }))
  .output(type({ schedule: schema.seoContentScheduleSelectSchema }))
  .handler(async ({ context, input }) => {
    const schedule = await context.db.query.seoContentSchedule.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.id, input.id),
          eq(table.projectId, input.projectId),
          eq(table.contentId, input.contentId),
          eq(table.organizationId, context.session.activeOrganizationId),
        ),
    });
    if (!schedule) {
      throw new ORPCError("NOT_FOUND", { message: "Schedule not found" });
    }
    return { schedule };
  });

const create = withOrganizationIdBase
  .route({ method: "POST", path: "/" })
  .input(schema.seoContentScheduleInsertSchema)
  .output(schema.seoContentScheduleSelectSchema)
  .handler(async ({ context, input }) => {
    const [created] = await context.db
      .insert(schema.seoContentSchedule)
      .values({
        ...input,
        organizationId: context.session.activeOrganizationId,
      })
      .returning();
    if (!created) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create schedule",
      });
    }
    return created;
  });

const update = withOrganizationIdBase
  .route({ method: "PATCH", path: "/{id}" })
  .input(schema.seoContentScheduleUpdateSchema)
  .output(schema.seoContentScheduleSelectSchema)
  .handler(async ({ context, input }) => {
    const [updated] = await context.db
      .update(schema.seoContentSchedule)
      .set({
        status: input.status,
        scheduledFor: input.scheduledFor,
        publishedAt: input.publishedAt,
        destination: input.destination,
        publishedUrl: input.publishedUrl,
      })
      .where(
        and(
          eq(schema.seoContentSchedule.id, input.id),
          eq(schema.seoContentSchedule.projectId, input.projectId),
          eq(schema.seoContentSchedule.contentId, input.contentId),
          eq(
            schema.seoContentSchedule.organizationId,
            context.session.activeOrganizationId,
          ),
        ),
      )
      .returning();
    if (!updated) {
      throw new ORPCError("NOT_FOUND", { message: "Schedule not found" });
    }
    return updated;
  });

const remove = withOrganizationIdBase
  .route({ method: "DELETE", path: "/{id}" })
  .input(type({ id: "string", projectId: "string", contentId: "string" }))
  .output(type({ success: "true" }))
  .handler(async ({ context, input }) => {
    const [row] = await context.db
      .delete(schema.seoContentSchedule)
      .where(
        and(
          eq(schema.seoContentSchedule.id, input.id),
          eq(schema.seoContentSchedule.projectId, input.projectId),
          eq(schema.seoContentSchedule.contentId, input.contentId),
          eq(
            schema.seoContentSchedule.organizationId,
            context.session.activeOrganizationId,
          ),
        ),
      )
      .returning();
    if (!row) {
      throw new ORPCError("NOT_FOUND", {
        message: "No schedule found to delete.",
      });
    }
    return { success: true } as const;
  });

export default withOrganizationIdBase
  .prefix("/organization/{organizationId}/project/{projectId}/schedule")
  .router({ list, get, create, update, remove });
