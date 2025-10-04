import { ORPCError } from "@orpc/client";
import { and, desc, eq, lt, schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { protectedBase } from "../context";
import { upsertProject } from "../lib/database/project";
import { createTask } from "../lib/task";
import { validateOrganizationMiddleware } from "../lib/validate-organization";

const list = protectedBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      organizationIdentifier: "string",
      limit: "1<=number<=100 = 20",
      "cursor?": "string.uuid|undefined",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      data: schema.seoProjectSelectSchema.array(),
      nextPageCursor: "string.uuid|undefined",
    }),
  )
  .handler(async ({ context, input }) => {
    const rows = await context.db.query.seoProject.findMany({
      where: and(
        eq(schema.seoProject.organizationId, context.organization.id),
        input.cursor ? lt(schema.seoProject.id, input.cursor) : undefined,
      ),
      orderBy: desc(schema.seoProject.id),
      limit: input.limit + 1,
    });
    const data = rows.slice(0, input.limit);
    const nextPageCursor =
      rows.length > input.limit ? data.at(-1)?.id : undefined;
    return { data, nextPageCursor };
  });

const checkName = protectedBase
  .route({ method: "GET", path: "/check-name/{name}" })
  .input(type({ name: "string", organizationIdentifier: "string" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(type({ exists: "boolean" }))
  .handler(async ({ context, input }) => {
    const row = await context.db.query.seoProject.findFirst({
      where: and(
        eq(schema.seoProject.organizationId, context.organization.id),
        eq(schema.seoProject.name, input.name),
      ),
    });
    // we want name to be unique within an organization
    return { exists: !!row };
  });

const get = protectedBase
  .route({ method: "GET", path: "/{identifier}" })
  .input(
    type({
      identifier: "string.url|string",
      organizationIdentifier: "string",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      "...": schema.seoProjectSelectSchema,
      tasks: schema.seoTaskRunSelectSchema.array(),
    }).or(type.null),
  )
  .handler(async ({ context, input }) => {
    if (input.identifier.startsWith("http")) {
      const row = await context.db.query.seoProject.findFirst({
        where: and(
          eq(schema.seoProject.websiteUrl, input.identifier),
          eq(schema.seoProject.organizationId, context.organization.id),
        ),
        with: {
          tasks: {
            orderBy(fields, { desc }) {
              return [desc(fields.createdAt)];
            },
            limit: 1,
          },
        },
      });
      return row ?? null;
    }
    const isSlug = type("string.uuid")(input.identifier) instanceof type.errors;
    const row = await context.db.query.seoProject.findFirst({
      where: and(
        isSlug
          ? eq(schema.seoProject.slug, input.identifier)
          : eq(schema.seoProject.id, input.identifier),
        eq(schema.seoProject.organizationId, context.organization.id),
      ),
      with: {
        tasks: {
          orderBy(fields, { desc }) {
            return [desc(fields.createdAt)];
          },
          limit: 1,
        },
      },
    });
    return row ?? null;
  });

const create = protectedBase
  .route({ method: "POST", path: "/" })
  .input(
    schema.seoProjectInsertSchema.pick("websiteUrl").merge(
      type({
        organizationIdentifier: "string",
      }),
    ),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(schema.seoProjectSelectSchema.merge(type({ taskId: "string" })))
  .handler(async ({ context, input }) => {
    // TODO(txn): revisit when we can support transactions
    const upsertProjectResult = await upsertProject({
      organizationId: context.organization.id,
      websiteUrl: input.websiteUrl,
    });
    if (!upsertProjectResult.ok) {
      throw upsertProjectResult.error;
    }
    const createTaskResult = await createTask({
      projectId: upsertProjectResult.value.id,
      userId: context.user.id,
      input: {
        type: "understand-site",
        websiteUrl: input.websiteUrl,
      },
    });
    if (!createTaskResult.ok) {
      throw createTaskResult.error;
    }
    return { ...upsertProjectResult.value, taskId: createTaskResult.value.id };
  });

const update = protectedBase
  .route({ method: "PATCH", path: "/{id}" })
  .input(
    schema.seoProjectUpdateSchema.merge(
      type({ organizationIdentifier: "string" }),
    ),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(schema.seoProjectSelectSchema)
  .handler(async ({ context, input }) => {
    const [row] = await context.db
      .update(schema.seoProject)
      .set(input)
      .where(
        and(
          eq(schema.seoProject.id, input.id),
          eq(schema.seoProject.organizationId, context.organization.id),
        ),
      )
      .returning();
    if (!row) {
      throw new ORPCError("NOT_FOUND", {
        message: "No project found to update.",
      });
    }
    return row;
  });

const remove = protectedBase
  .route({ method: "DELETE", path: "/{id}" })
  .input(type({ id: "string", organizationIdentifier: "string" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(type({ success: "true" }))
  .handler(async ({ context, input }) => {
    const [row] = await context.db
      .delete(schema.seoProject)
      .where(
        and(
          eq(schema.seoProject.id, input.id),
          eq(schema.seoProject.organizationId, context.organization.id),
        ),
      )
      .returning();
    if (!row) {
      throw new ORPCError("NOT_FOUND", {
        message: "No project found to delete.",
      });
    }
    return { success: true } as const;
  });

export default protectedBase
  .prefix("/organization/{organizationIdentifier}/project")
  .router({ list, create, update, remove, checkName, get });
