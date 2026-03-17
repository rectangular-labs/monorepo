import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { randomUUID } from "node:crypto";
import { formatStrategyGoal } from "@rectangular-labs/core/format/strategy-goal";
import type { strategyPhaseSuggestionScheme } from "@rectangular-labs/core/schemas/strategy-parsers";
import type {
  seoGenerateStrategyPhaseTaskInputSchema,
  seoGenerateStrategyPhaseTaskOutputSchema,
} from "@rectangular-labs/core/schemas/task-parsers";
import { computePhaseTargetCompletionDate } from "@rectangular-labs/core/strategy/compute-phase-target-completion-date";
import type { schema } from "@rectangular-labs/db";
import { createDb } from "@rectangular-labs/db";
import {
  createContentDraft,
  createStrategyPhase,
  createStrategyPhaseContent,
  getSeoProjectById,
  getStrategyDetails,
  listUnassignedContentDrafts,
  updateContentDraft,
} from "@rectangular-labs/db/operations";
import { createStrategyAdvisorAgent } from "../lib/ai/agents/strategy-advisor";
import { summarizeAgentInvocation } from "../lib/ai/utils/agent-telemetry";
import { createWorkflowAuth } from "../lib/ai/utils/auth-init";
import { getGscIntegrationForProject } from "../lib/database/gsc-integration";
import { createSeoWriteArticleTasksBatch, createTask } from "../lib/task";
import type { InitialContext } from "../types";

function logInfo(message: string, data?: Record<string, unknown>) {
  console.info(`[SeoStrategyPhaseGenerationWorkflow] ${message}`, data ?? {});
}

function logError(message: string, data?: Record<string, unknown>) {
  console.error(`[SeoStrategyPhaseGenerationWorkflow] ${message}`, data ?? {});
}

type StrategyPhaseGenerationInput =
  typeof seoGenerateStrategyPhaseTaskInputSchema.infer;

export type SeoStrategyPhaseGenerationWorkflowBinding =
  Workflow<StrategyPhaseGenerationInput>;

type StrategyDetails = NonNullable<
  Awaited<ReturnType<typeof getStrategyDetails>> extends infer T
    ? T extends { ok: true; value: infer V }
      ? V
      : never
    : never
>;

type DraftTarget = Pick<
  typeof schema.seoContentDraft.$inferSelect,
  "id" | "slug" | "title" | "primaryKeyword" | "status"
> & {
  source: "unassigned" | "prior-phase";
};

function formatDraftTargets(drafts: DraftTarget[]) {
  if (drafts.length === 0) {
    return "- none";
  }

  return drafts
    .map((draft) => {
      const title = draft.title ? `"${draft.title}"` : "(untitled)";
      return [
        `- id:${draft.id}`,
        `source:${draft.source}`,
        `slug:${draft.slug}`,
        `title:${title}`,
        `keyword:${draft.primaryKeyword || "(missing)"}`,
        `status:${draft.status}`,
      ].join(" |");
    })
    .join("\n");
}

function formatStrategyPhaseHistory(phases: StrategyDetails["phases"]) {
  if (phases.length === 0) {
    return "- none";
  }

  return phases
    .map((phase, index) => {
      const contentSummary =
        phase.phaseContents.length === 0
          ? "none"
          : phase.phaseContents
              .map((content) => {
                const title = content.contentDraft?.title || "(untitled)";
                const keyword =
                  content.contentDraft?.primaryKeyword || "(missing)";
                return `${content.action}:${title}:${keyword}`;
              })
              .join(", ");

      return [
        `- phase ${index + 1}: ${phase.name}`,
        `status:${phase.status}`,
        `type:${phase.type}`,
        `success:${phase.successCriteria}`,
        `observationWeeks:${phase.observationWeeks}`,
        `content:${contentSummary}`,
      ].join(" |");
    })
    .join("\n");
}

export class SeoStrategyPhaseGenerationWorkflow extends WorkflowEntrypoint<
  {
    CACHE: InitialContext["cacheKV"];
  },
  StrategyPhaseGenerationInput
> {
  async run(
    event: WorkflowEvent<StrategyPhaseGenerationInput>,
    step: WorkflowStep,
  ) {
    const input = event.payload;

    logInfo("start", {
      instanceId: event.instanceId,
      projectId: input.projectId,
      strategyId: input.strategyId,
    });

    const { project, strategy } = await step.do(
      "load project + strategy",
      async () => {
        const db = createDb();

        const projectResult = await getSeoProjectById(db, input.projectId);
        if (!projectResult.ok) {
          throw projectResult.error;
        }
        if (!projectResult.value) {
          throw new NonRetryableError(`Missing project ${input.projectId}`);
        }

        const strategyResult = await getStrategyDetails({
          db,
          projectId: input.projectId,
          strategyId: input.strategyId,
          organizationId: input.organizationId,
        });
        if (!strategyResult.ok) {
          throw strategyResult.error;
        }
        if (!strategyResult.value) {
          throw new NonRetryableError(`Missing strategy ${input.strategyId}`);
        }

        return { project: projectResult.value, strategy: strategyResult.value };
      },
    );

    const candidateDrafts = await step.do("load candidate drafts", async () => {
      const db = createDb();

      const unassignedResult = await listUnassignedContentDrafts({
        db,
        organizationId: input.organizationId,
        projectId: input.projectId,
      });
      if (!unassignedResult.ok) {
        throw unassignedResult.error;
      }

      const combined = new Map<string, DraftTarget>();

      for (const draft of unassignedResult.value) {
        combined.set(draft.id, {
          ...draft,
          source: "unassigned",
        });
      }

      for (const phase of strategy.phases) {
        for (const content of phase.phaseContents) {
          if (!content.contentDraft) {
            continue;
          }

          const { contentDraft: draft } = content;
          combined.set(draft.id, {
            id: draft.id,
            slug: draft.slug,
            title: draft.title,
            primaryKeyword: draft.primaryKeyword,
            status: draft.status,
            source: "prior-phase",
          });
        }
      }

      return Array.from(combined.values());
    });

    const suggestion = await step.do(
      "generate phase suggestion",
      { timeout: "10 minutes" },
      async () => {
        const db = createDb();

        const gscIntegrationResult = await getGscIntegrationForProject({
          db,
          projectId: project.id,
          organizationId: project.organizationId,
          authOverride: createWorkflowAuth(db),
        });
        if (!gscIntegrationResult.ok) {
          logError("failed to load GSC integration", {
            projectId: project.id,
            organizationId: project.organizationId,
            error: gscIntegrationResult.error,
          });
          throw gscIntegrationResult.error;
        }

        const { agent } = createStrategyAdvisorAgent<
          typeof strategyPhaseSuggestionScheme.infer
        >({
          db,
          project,
          cacheKV: this.env.CACHE,
          jsonSchema: {
            type: "object",
            additionalProperties: false,
            required: ["phase", "contentUpdates", "contentCreations"],
            properties: {
              phase: {
                type: "object",
                additionalProperties: false,
                required: [
                  "type",
                  "name",
                  "observationWeeks",
                  "successCriteria",
                  "cadence",
                ],
                properties: {
                  type: {
                    type: "string",
                    enum: ["build", "optimize", "expand"],
                  },
                  name: { type: "string" },
                  observationWeeks: { type: "number" },
                  successCriteria: { type: "string" },
                  cadence: {
                    type: "object",
                    additionalProperties: false,
                    required: ["period", "frequency", "allowedDays"],
                    properties: {
                      period: {
                        type: "string",
                        enum: ["daily", "weekly", "monthly"],
                      },
                      frequency: { type: "number" },
                      allowedDays: {
                        type: "array",
                        items: {
                          type: "string",
                          enum: [
                            "mon",
                            "tue",
                            "wed",
                            "thu",
                            "fri",
                            "sat",
                            "sun",
                          ],
                        },
                      },
                    },
                  },
                },
              },
              contentUpdates: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "action",
                    "contentDraftId",
                    "updatedRole",
                    "updatedTitle",
                    "updatedDescription",
                    "updatedPrimaryKeyword",
                    "updatedNotes",
                  ],
                  properties: {
                    action: {
                      type: "string",
                      enum: ["improve", "expand"],
                    },
                    contentDraftId: { type: "string" },
                    updatedRole: {
                      type: ["string", "null"],
                      enum: ["pillar", "supporting", null],
                    },
                    updatedTitle: { type: ["string", "null"] },
                    updatedDescription: { type: ["string", "null"] },
                    updatedPrimaryKeyword: { type: ["string", "null"] },
                    updatedNotes: { type: ["string", "null"] },
                  },
                },
              },
              contentCreations: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "action",
                    "role",
                    "plannedSlug",
                    "plannedPrimaryKeyword",
                    "notes",
                  ],
                  properties: {
                    action: {
                      type: "string",
                      enum: ["create"],
                    },
                    role: {
                      type: "string",
                      enum: ["pillar", "supporting"],
                    },
                    plannedSlug: { type: "string" },
                    plannedPrimaryKeyword: { type: "string" },
                    notes: { type: ["string", "null"] },
                  },
                },
              },
            },
          },
          gscProperty: gscIntegrationResult.value
            ? {
                config: gscIntegrationResult.value.config,
                accessToken: gscIntegrationResult.value.accessToken,
              }
            : null,
        });

        const result = await agent.generate({
          prompt: `Generate the NEXT execution phase for this strategy.

<strategy>
Name: ${strategy.name}
Motivation: ${strategy.motivation}
Description: ${strategy.description ?? "(none)"}
Goal: ${formatStrategyGoal(strategy.goal)}
</strategy>

<history>
${formatStrategyPhaseHistory(strategy.phases)}
</history>

<candidate-existing-drafts>
${formatDraftTargets(candidateDrafts)}
</candidate-existing-drafts>`,
        });
        const telemetry = summarizeAgentInvocation(result.steps);
        logInfo("strategy advisor invocation complete", {
          instanceId: event.instanceId,
          projectId: project.id,
          strategyId: strategy.id,
          ...telemetry,
        });

        return result.output;
      },
    );

    const now = new Date();

    const phaseResult = await step.do("create phase + contents", async () => {
      const db = createDb();
      const phaseStatus =
        strategy.phases.length === 0 ? "planned" : "suggestion";
      const targetCompletionDate = computePhaseTargetCompletionDate({
        phaseStatus,
        cadence: suggestion.phase.cadence,
        contentCreationsCount: suggestion.contentCreations.length,
        contentUpdatesCount: suggestion.contentUpdates.length,
        now,
      });

      const phaseInsert = await createStrategyPhase(db, {
        strategyId: strategy.id,
        type: suggestion.phase.type,
        name: suggestion.phase.name,
        observationWeeks: suggestion.phase.observationWeeks,
        successCriteria: suggestion.phase.successCriteria,
        cadence: suggestion.phase.cadence,
        status: phaseStatus,
        startedAt: phaseStatus === "planned" ? now : null,
        targetCompletionDate,
      });
      if (!phaseInsert.ok) {
        throw phaseInsert.error;
      }

      const phase = phaseInsert.value;
      const allPhaseDraftIds = new Set<string>();
      const createdDraftIds: string[] = [];
      const draftIdsToUpdate: string[] = [];
      const candidateById = new Map(
        candidateDrafts.map((draft) => [draft.id, draft]),
      );

      for (const contentUpdate of suggestion.contentUpdates) {
        const knownDraft = candidateById.get(contentUpdate.contentDraftId);
        if (!knownDraft) {
          logError(
            "content update draft not found in candidate set, skipping",
            {
              draftId: contentUpdate.contentDraftId,
            },
          );
          continue;
        }

        const updatedDraft = await updateContentDraft(db, {
          id: contentUpdate.contentDraftId,
          projectId: input.projectId,
          organizationId: input.organizationId,
          strategyId: strategy.id,
          title: contentUpdate.updatedTitle,
          description: contentUpdate.updatedDescription,
          primaryKeyword: contentUpdate.updatedPrimaryKeyword ?? undefined,
          role: contentUpdate.updatedRole,
          notes: contentUpdate.updatedNotes ?? null,
        });
        if (!updatedDraft.ok) {
          throw updatedDraft.error;
        }

        const phaseContentResult = await createStrategyPhaseContent(db, {
          phaseId: phase.id,
          contentDraftId: updatedDraft.value.id,
          action: contentUpdate.action,
        });
        if (!phaseContentResult.ok) {
          throw phaseContentResult.error;
        }

        if (contentUpdate.updatedNotes) {
          draftIdsToUpdate.push(updatedDraft.value.id);
        }
        allPhaseDraftIds.add(updatedDraft.value.id);
      }

      for (const contentCreation of suggestion.contentCreations) {
        const draftInsert = await createContentDraft(db, {
          projectId: input.projectId,
          organizationId: input.organizationId,
          slug: contentCreation.plannedSlug,
          primaryKeyword: contentCreation.plannedPrimaryKeyword,
          status: "queued",
          strategyId: strategy.id,
          role: contentCreation.role,
          notes: contentCreation.notes ?? null,
        });
        if (!draftInsert.ok) {
          throw draftInsert.error;
        }

        const phaseContentResult = await createStrategyPhaseContent(db, {
          phaseId: phase.id,
          contentDraftId: draftInsert.value.id,
          action: contentCreation.action,
        });
        if (!phaseContentResult.ok) {
          throw phaseContentResult.error;
        }

        createdDraftIds.push(draftInsert.value.id);
        allPhaseDraftIds.add(draftInsert.value.id);
      }

      return {
        phase,
        draftIds: Array.from(allPhaseDraftIds),
        createdDraftIds,
        draftIdsToUpdate,
      };
    });

    await step.do("trigger writer workflow for new content", async () => {
      const db = createDb();
      const draftIds = Array.from(
        new Set([
          ...phaseResult.createdDraftIds,
          ...phaseResult.draftIdsToUpdate,
        ]),
      );

      const taskResult = await createSeoWriteArticleTasksBatch({
        db,
        userId: input.userId,
        tasks: draftIds.map((draftId) => ({
          input: {
            type: "seo-write-article",
            projectId: input.projectId,
            organizationId: input.organizationId,
            userId: input.userId,
            chatId: null,
            draftId,
          },
          workflowInstanceId: `write_${draftId}_${event.instanceId.slice(-6)}`,
        })),
      });

      if (!taskResult.ok) {
        throw taskResult.error;
      }
    });

    await step.do("queue initial phase snapshot", async () => {
      const db = createDb();
      const taskResult = await createTask({
        db,
        userId: input.userId,
        input: {
          type: "seo-generate-strategy-snapshot",
          projectId: input.projectId,
          organizationId: input.organizationId,
          strategyId: strategy.id,
          phaseId: phaseResult.phase.id,
          userId: input.userId,
          triggerType: "phase_complete",
        },
        workflowInstanceId: `strategy_snapshot_for_${event.instanceId}_${randomUUID().slice(-6)}`,
      });
      if (!taskResult.ok) {
        throw taskResult.error;
      }
      return taskResult.value.id;
    });

    logInfo("complete", {
      instanceId: event.instanceId,
      strategyId: strategy.id,
      phaseId: phaseResult.phase.id,
      draftCount: phaseResult.draftIds.length,
      newDraftCount: phaseResult.createdDraftIds.length,
    });

    return {
      type: "seo-generate-strategy-phase",
      strategyId: strategy.id,
      phaseId: phaseResult.phase.id,
      draftIds: phaseResult.draftIds,
    } satisfies typeof seoGenerateStrategyPhaseTaskOutputSchema.infer;
  }
}
