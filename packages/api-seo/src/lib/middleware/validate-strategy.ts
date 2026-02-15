import { ORPCError, os } from "@orpc/server";
import type { Session } from "@rectangular-labs/auth";
import { getStrategy } from "@rectangular-labs/db/operations";
import type { InitialContext } from "../../types";

type Organization = { id: string };

/**
 * Middleware to validate strategy ownership within a project and organization.
 * Adds the strategy to context when found.
 */
export const validateStrategyMiddleware = os
  .$context<InitialContext & Session & { organization: Organization }>()
  .middleware(
    async (
      { next, context },
      params: { strategyId: string; projectId: string },
    ) => {
      const strategyResult = await getStrategy({
        db: context.db,
        projectId: params.projectId,
        strategyId: params.strategyId,
        organizationId: context.organization.id,
      });

      if (!strategyResult.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to load strategy.",
          cause: strategyResult.error,
        });
      }

      if (!strategyResult.value) {
        throw new ORPCError("NOT_FOUND", {
          message: "No strategy found.",
        });
      }

      return await next({
        context: {
          strategy: strategyResult.value,
        },
      });
    },
  );
