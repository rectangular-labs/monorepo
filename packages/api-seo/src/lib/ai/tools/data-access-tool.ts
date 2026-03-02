import {
  ARTICLE_TYPES,
  CONTENT_STATUSES,
} from "@rectangular-labs/core/schemas/content-parsers";
import {
  CONTENT_ROLES,
  STRATEGY_STATUSES,
} from "@rectangular-labs/core/schemas/strategy-parsers";
import type { DB, schema } from "@rectangular-labs/db";
import {
  getDraftById,
  getStrategyDetails,
  listContentDraftsWithLatestSnapshot,
  listStrategiesByProjectId,
  softDeleteDraft,
  softDeleteStrategy,
  updateContentDraft,
  updateStrategy,
} from "@rectangular-labs/db/operations";
import { jsonSchema, tool } from "ai";

export function createDataAccessTools(args: {
  db: DB;
  organizationId: string;
  projectId: string;
}) {
  const listData = tool({
    description:
      "List existing project strategies or content drafts. Use this before read/search/update/delete when you need IDs.",
    inputSchema: jsonSchema<{
      entityType: "strategies" | "contentDrafts";
      limit?: number;
    }>({
      type: "object",
      additionalProperties: false,
      required: ["entityType"],
      properties: {
        entityType: {
          type: "string",
          enum: ["strategies", "contentDrafts"],
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 200,
          default: 50,
        },
      },
    }),
    inputExamples: [
      { input: { entityType: "strategies", limit: 20 } },
      { input: { entityType: "contentDrafts", limit: 50 } },
    ],
    async execute({ entityType, limit = 50 }) {
      if (entityType === "strategies") {
        const result = await listStrategiesByProjectId({
          db: args.db,
          projectId: args.projectId,
          organizationId: args.organizationId,
        });
        if (!result.ok) {
          return { success: false as const, error: result.error.message };
        }
        return {
          success: true as const,
          entityType,
          rows: result.value.slice(0, limit).map((strategy) => ({
            id: strategy.id,
            name: strategy.name,
            status: strategy.status,
            updatedAt: strategy.updatedAt,
          })),
        };
      }

      const result = await listContentDraftsWithLatestSnapshot({
        db: args.db,
        organizationId: args.organizationId,
        projectId: args.projectId,
      });
      if (!result.ok) {
        return { success: false as const, error: result.error.message };
      }

      return {
        success: true as const,
        entityType,
        rows: result.value.slice(0, limit).map((draft) => ({
          id: draft.id,
          title: draft.title,
          slug: draft.slug,
          primaryKeyword: draft.primaryKeyword,
          status: draft.status,
          strategyName: draft.strategy?.name ?? null,
        })),
      };
    },
  });

  const searchData = tool({
    description:
      "Search strategies or content drafts by text query across key fields. Useful when you know a keyword/title but not the ID.",
    inputSchema: jsonSchema<{
      entityType: "strategies" | "contentDrafts";
      query: string;
      limit?: number;
    }>({
      type: "object",
      additionalProperties: false,
      required: ["entityType", "query"],
      properties: {
        entityType: {
          type: "string",
          enum: ["strategies", "contentDrafts"],
        },
        query: {
          type: "string",
          minLength: 1,
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 200,
          default: 25,
        },
      },
    }),
    inputExamples: [
      {
        input: {
          entityType: "strategies",
          query: "programmatic seo",
          limit: 10,
        },
      },
      {
        input: {
          entityType: "contentDrafts",
          query: "invoice automation",
          limit: 25,
        },
      },
    ],
    async execute({ entityType, query, limit = 25 }) {
      const term = query.trim().toLowerCase();
      if (!term) {
        return { success: false as const, error: "Query cannot be empty." };
      }

      if (entityType === "strategies") {
        const result = await listStrategiesByProjectId({
          db: args.db,
          projectId: args.projectId,
          organizationId: args.organizationId,
        });
        if (!result.ok) {
          return { success: false as const, error: result.error.message };
        }
        return {
          success: true as const,
          entityType,
          rows: result.value
            .filter((strategy) =>
              [strategy.name, strategy.description, strategy.motivation]
                .filter((value): value is string => Boolean(value))
                .some((value) => value.toLowerCase().includes(term)),
            )
            .slice(0, limit)
            .map((strategy) => ({
              id: strategy.id,
              name: strategy.name,
              status: strategy.status,
              updatedAt: strategy.updatedAt,
            })),
        };
      }

      const result = await listContentDraftsWithLatestSnapshot({
        db: args.db,
        organizationId: args.organizationId,
        projectId: args.projectId,
      });
      if (!result.ok) {
        return { success: false as const, error: result.error.message };
      }
      return {
        success: true as const,
        entityType,
        rows: result.value
          .filter((draft) =>
            [draft.title, draft.slug, draft.primaryKeyword]
              .filter((value): value is string => Boolean(value))
              .some((value) => value.toLowerCase().includes(term)),
          )
          .slice(0, limit)
          .map((draft) => ({
            id: draft.id,
            title: draft.title,
            slug: draft.slug,
            primaryKeyword: draft.primaryKeyword,
            status: draft.status,
          })),
      };
    },
  });

  const readData = tool({
    description:
      "Read an existing strategy or content draft. Content reads focus on drafts only, not published versions.",
    inputSchema: jsonSchema<{
      entityType: "strategy" | "contentDraft";
      id: string;
      slug?: string;
      includeContentMarkdown?: boolean;
    }>({
      type: "object",
      additionalProperties: false,
      required: ["entityType", "id"],
      properties: {
        entityType: {
          type: "string",
          enum: ["strategy", "contentDraft"],
        },
        id: {
          type: "string",
          description: "The ID of the entity to read.",
        },
        slug: {
          type: "string",
          description:
            "Alternative lookup for contentDraft when id is unknown.",
        },
        includeContentMarkdown: {
          type: "boolean",
          default: true,
        },
      },
    }),
    inputExamples: [
      {
        input: {
          entityType: "strategy",
          id: "00000000-0000-0000-0000-000000000000",
        },
      },
      {
        input: {
          entityType: "contentDraft",
          id: "00000000-0000-0000-0000-000000000000",
          includeContentMarkdown: true,
        },
      },
    ],
    async execute(input) {
      if (input.entityType === "strategy") {
        const result = await getStrategyDetails({
          db: args.db,
          projectId: args.projectId,
          strategyId: input.id,
          organizationId: args.organizationId,
        });
        if (!result.ok) {
          return { success: false as const, error: result.error.message };
        }
        if (!result.value) {
          return { success: false as const, error: "Strategy not found." };
        }
        return {
          success: true as const,
          entityType: "strategy",
          row: result.value,
        };
      }

      const includeContentMarkdown = input.includeContentMarkdown ?? true;
      const draftResult = await getDraftById({
        db: args.db,
        organizationId: args.organizationId,
        projectId: args.projectId,
        id: input.id,
        withContent: includeContentMarkdown,
      });

      if (!draftResult.ok) {
        return { success: false as const, error: draftResult.error.message };
      }
      if (!draftResult.value) {
        return { success: false as const, error: "Content draft not found." };
      }
      return {
        success: true as const,
        entityType: "contentDraft",
        row: draftResult.value,
      };
    },
  });

  const updateStrategyData = tool({
    description:
      "Update an existing strategy using strategy fields directly in the input.",
    inputSchema: jsonSchema<
      Omit<
        typeof schema.seoStrategyUpdateSchema.infer,
        "projectId" | "organizationId"
      >
    >({
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: {
        id: {
          type: "string",
          format: "uuid",
        },
        name: {
          type: "string",
        },
        description: {
          type: ["string", "null"],
        },
        motivation: {
          type: "string",
        },
        goal: {
          type: "object",
          additionalProperties: false,
          required: ["metric", "target", "timeframe"],
          properties: {
            metric: {
              type: "string",
              enum: ["clicks"],
            },
            target: {
              type: "number",
            },
            timeframe: {
              type: "string",
              enum: ["monthly", "total"],
            },
          },
        },
        dismissalReason: {
          type: ["string", "null"],
        },
        status: {
          type: "string",
          enum: [...STRATEGY_STATUSES],
        },
      },
    }),
    inputExamples: [
      {
        input: {
          id: "00000000-0000-0000-0000-000000000000",
          name: "AI SEO Expansion Strategy",
          motivation: "Expand non-branded traffic in Q2",
        },
      },
    ],
    async execute(input) {
      const result = await updateStrategy(args.db, {
        ...input,
        projectId: args.projectId,
        organizationId: args.organizationId,
      });
      if (!result.ok) {
        return { success: false as const, error: result.error.message };
      }
      return {
        success: true as const,
        entityType: "strategy",
        row: result.value,
      };
    },
  });

  const updateContentDraftData = tool({
    description:
      "Update an existing content draft using content draft fields directly in the input.",
    inputSchema: jsonSchema<
      Omit<
        typeof schema.seoContentDraftUpdateSchema.infer,
        | "projectId"
        | "organizationId"
        | "strategyId"
        | "deletedAt"
        | "outlineGeneratedByTaskRunId"
        | "generatedByTaskRunId"
      >
    >({
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: {
        id: {
          type: "string",
          format: "uuid",
        },
        slug: {
          type: "string",
        },
        primaryKeyword: {
          type: "string",
        },
        title: {
          type: ["string", "null"],
        },
        description: {
          type: ["string", "null"],
        },
        heroImage: {
          type: ["string", "null"],
        },
        heroImageCaption: {
          type: ["string", "null"],
        },
        articleType: {
          type: ["string", "null"],
          enum: [...ARTICLE_TYPES, null],
        },
        role: {
          type: ["string", "null"],
          enum: [...CONTENT_ROLES, null],
        },
        notes: {
          type: ["string", "null"],
        },
        outline: {
          type: ["string", "null"],
        },
        contentMarkdown: {
          type: ["string", "null"],
        },
        status: {
          type: "string",
          enum: [...CONTENT_STATUSES],
        },
        scheduledFor: {
          type: ["string", "null"],
          format: "date-time",
        },
      },
    }),
    inputExamples: [
      {
        input: {
          id: "00000000-0000-0000-0000-000000000000",
          contentMarkdown: "# Updated draft\n\n...",
        },
      },
      {
        input: {
          id: "00000000-0000-0000-0000-000000000000",
          title: "Invoice Automation: Practical Guide",
          primaryKeyword: "invoice automation software",
        },
      },
    ],
    async execute(input) {
      const parsedScheduledFor =
        input.scheduledFor == null
          ? input.scheduledFor
          : new Date(input.scheduledFor);

      if (
        parsedScheduledFor != null &&
        Number.isNaN(parsedScheduledFor.getTime())
      ) {
        return {
          success: false as const,
          error: "scheduledFor must be a valid ISO date-time string.",
        };
      }

      const result = await updateContentDraft(args.db, {
        ...input,
        scheduledFor: parsedScheduledFor,
        projectId: args.projectId,
        organizationId: args.organizationId,
      });
      if (!result.ok) {
        return { success: false as const, error: result.error.message };
      }
      return {
        success: true as const,
        entityType: "contentDraft",
        row: result.value,
      };
    },
  });

  const deleteData = tool({
    description:
      "Removes an existing strategy or content draft. Deleting a strategy does not delete its content; deleting a content draft also unpublishes its published versions. This tool requires human approval before execution.",
    inputSchema: jsonSchema<{
      entityType: "strategy" | "contentDraft";
      id: string;
      reason?: string;
    }>({
      type: "object",
      additionalProperties: false,
      required: ["entityType", "id"],
      properties: {
        entityType: {
          type: "string",
          enum: ["strategy", "contentDraft"],
        },
        id: {
          type: "string",
        },
        reason: {
          type: "string",
        },
      },
    }),
    inputExamples: [
      {
        input: {
          entityType: "strategy",
          id: "00000000-0000-0000-0000-000000000000",
          reason: "Deprecated strategy",
        },
      },
      {
        input: {
          entityType: "contentDraft",
          id: "00000000-0000-0000-0000-000000000000",
          reason: "Merged into another draft",
        },
      },
    ],
    needsApproval: true,
    async execute({ entityType, id, reason }) {
      if (entityType === "strategy") {
        const result = await softDeleteStrategy({
          db: args.db,
          id,
          projectId: args.projectId,
          organizationId: args.organizationId,
          dismissalReason: reason ?? null,
        });
        if (!result.ok) {
          return { success: false as const, error: result.error.message };
        }
        return {
          success: true as const,
          entityType,
          id,
          deletedAt: result.value.deletedAt,
        };
      }

      const result = await softDeleteDraft({
        db: args.db,
        id,
        projectId: args.projectId,
        organizationId: args.organizationId,
      });
      if (!result.ok) {
        return { success: false as const, error: result.error.message };
      }

      return {
        success: true as const,
        entityType,
        id,
        deletedAt: result.value.deletedAt,
      };
    },
  });

  return {
    tools: {
      list_existing_data: listData,
      search_existing_data: searchData,
      read_existing_data: readData,
      update_existing_strategy: updateStrategyData,
      update_existing_content_draft: updateContentDraftData,
      delete_existing_data: deleteData,
    } as const,
  };
}
