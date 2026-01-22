import { ORPCError, os } from "@orpc/server";
import type { Session } from "@rectangular-labs/auth";
import type { schema } from "@rectangular-labs/db";
import { getIntegration } from "@rectangular-labs/db/operations";
import type { InitialContext } from "../../types";

type Organization = Pick<typeof schema.organization.$inferSelect, "id">;

/**
 * Middleware to validate that an integration exists and belongs to the
 * specified project and organization. Adds the integration to the context.
 *
 * @param params.id - The integration ID
 * @param params.projectId - The project ID
 */
export const validateIntegrationMiddleware = os
  .$context<InitialContext & Session & { organization: Organization }>()
  .middleware(
    async ({ next, context }, params: { id: string; projectId: string }) => {
      const integrationResult = await getIntegration(context.db, {
        id: params.id,
        projectId: params.projectId,
        organizationId: context.organization.id,
      });

      if (!integrationResult.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: integrationResult.error.message,
        });
      }

      if (!integrationResult.value) {
        throw new ORPCError("NOT_FOUND", { message: "Integration not found." });
      }

      return await next({
        context: {
          integration: integrationResult.value,
        },
      });
    },
  );
