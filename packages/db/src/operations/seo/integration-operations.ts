import {
  type IntegrationProvider,
  type IntegrationStatus,
  PUBLISH_DESTINATION_PROVIDERS,
} from "@rectangular-labs/core/schemas/integration-parsers";
import { err, ok, safe } from "@rectangular-labs/result";
import { and, eq } from "drizzle-orm";
import { type DB, schema } from "../../client";

export function getIntegration(
  db: DB,
  params: { id: string; projectId: string; organizationId: string },
) {
  return safe(() =>
    db.query.seoIntegration.findFirst({
      where: (table, { eq, and }) =>
        and(
          eq(table.id, params.id),
          eq(table.projectId, params.projectId),
          eq(table.organizationId, params.organizationId),
        ),
    }),
  );
}

export function listIntegrations(
  db: DB,
  params: { projectId: string; organizationId: string },
) {
  return safe(() =>
    db.query.seoIntegration.findMany({
      where: (table, { eq, and }) =>
        and(
          eq(table.organizationId, params.organizationId),
          eq(table.projectId, params.projectId),
        ),
      orderBy: (table, { desc }) => desc(table.updatedAt),
    }),
  );
}

export async function createIntegration(
  db: DB,
  values: typeof schema.seoIntegration.$inferInsert,
) {
  const result = await safe(() =>
    db.insert(schema.seoIntegration).values(values).returning(),
  );
  if (!result.ok) {
    return result;
  }
  const created = result.value[0];
  if (!created) {
    return err(new Error("Failed to create integration"));
  }
  return ok(created);
}

export async function updateIntegration(
  db: DB,
  params: {
    id: string;
    organizationId?: string;
    projectId?: string;
    values: Partial<typeof schema.seoIntegration.$inferInsert>;
  },
) {
  const where = and(
    eq(schema.seoIntegration.id, params.id),
    params.organizationId
      ? eq(schema.seoIntegration.organizationId, params.organizationId)
      : undefined,
    params.projectId
      ? eq(schema.seoIntegration.projectId, params.projectId)
      : undefined,
  );

  const result = await safe(() =>
    db
      .update(schema.seoIntegration)
      .set(params.values)
      .where(where)
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  const updated = result.value[0];
  if (!updated) {
    return err(new Error("Failed to update integration"));
  }
  return ok(updated);
}

/**
 * Get an integration for a specific provider (regardless of status).
 * Returns the first integration found for the given provider.
 */
export function getProviderIntegration(
  db: DB,
  params: {
    projectId: string;
    organizationId: string;
    provider: IntegrationProvider;
    status?: IntegrationStatus;
    includeAccount?: boolean;
  },
) {
  return safe(() =>
    db.query.seoIntegration.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.projectId, params.projectId),
          eq(table.organizationId, params.organizationId),
          eq(table.provider, params.provider),
          params.status ? eq(table.status, params.status) : undefined,
        ),
      with: {
        account: params.includeAccount ? true : undefined,
      },
    }),
  );
}

/**
 * Get all default publishing integrations for a project.
 * Returns integrations where isDefault=true and status=active,
 * filtered to the specified providers.
 */
export function getDefaultPublishingIntegrations(
  db: DB,
  params: {
    organizationId: string;
    projectId: string;
  },
) {
  return safe(() =>
    db.query.seoIntegration.findMany({
      where: (table, { and, eq, inArray }) =>
        and(
          eq(table.organizationId, params.organizationId),
          eq(table.projectId, params.projectId),
          inArray(table.provider, PUBLISH_DESTINATION_PROVIDERS),
          eq(table.status, "active"),
          eq(table.isDefault, true),
        ),
      with: {
        account: true,
      },
    }),
  );
}

/**
 * Clear the isDefault flag for all integrations in a project.
 * Used before setting a new default integration to ensure only one default exists.
 */
export function clearDefaultIntegrations(
  db: DB,
  params: {
    organizationId: string;
    projectId: string;
  },
) {
  return safe(() =>
    db
      .update(schema.seoIntegration)
      .set({ isDefault: false })
      .where(
        and(
          eq(schema.seoIntegration.organizationId, params.organizationId),
          eq(schema.seoIntegration.projectId, params.projectId),
          eq(schema.seoIntegration.isDefault, true),
        ),
      )
      .returning(),
  );
}
