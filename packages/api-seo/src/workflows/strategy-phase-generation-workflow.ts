import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { randomUUID } from "node:crypto";
import { openai } from "@ai-sdk/openai";
import { initAuthHandler } from "@rectangular-labs/auth";
import { formatStrategyGoal } from "@rectangular-labs/core/format/strategy-goal";
import { strategyPhaseSuggestionScheme } from "@rectangular-labs/core/schemas/strategy-parsers";
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
import {
  generateText,
  type JSONSchema7,
  jsonSchema,
  Output,
  stepCountIs,
} from "ai";
import { apiEnv } from "../env";
import { createDataforseoToolWithMetadata } from "../lib/ai/tools/dataforseo-tool";
import { createGscToolWithMetadata } from "../lib/ai/tools/google-search-console-tool";
import { createStrategyToolsWithMetadata } from "../lib/ai/tools/strategy-tools";
import { createWebToolsWithMetadata } from "../lib/ai/tools/web-tools";
import { formatBusinessBackground } from "../lib/ai/utils/format-business-background";
import { logAgentStep } from "../lib/ai/utils/log-agent-step";
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

type PhaseSuggestion = typeof strategyPhaseSuggestionScheme.infer;
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
  if (drafts.length === 0) return "- none";
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
  if (phases.length === 0) return "- none";

  return phases
    .map((phase, index) => {
      const contentSummary =
        phase.phaseContents.length === 0
          ? "none"
          : phase.phaseContents
              .map((content) => {
                const title = content.contentDraft?.title || "(untitled)";
                const keyword =
                  content.plannedPrimaryKeyword ||
                  content.contentDraft?.primaryKeyword ||
                  "(missing)";
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

async function getGscIntegrationOrThrow(args: {
  db: ReturnType<typeof createDb>;
  projectId: string;
  organizationId: string;
  context: string;
}) {
  const env = apiEnv();
  const auth = initAuthHandler({
    baseURL: env.SEO_URL,
    db: args.db,
    encryptionKey: env.AUTH_SEO_ENCRYPTION_KEY,
    fromEmail: env.AUTH_SEO_FROM_EMAIL,
    inboundApiKey: env.SEO_INBOUND_API_KEY,
    credentialVerificationType: env.AUTH_SEO_CREDENTIAL_VERIFICATION_TYPE,
    discordClientId: env.AUTH_SEO_DISCORD_ID,
    discordClientSecret: env.AUTH_SEO_DISCORD_SECRET,
    githubClientId: env.AUTH_SEO_GITHUB_ID,
    githubClientSecret: env.AUTH_SEO_GITHUB_SECRET,
    googleClientId: env.AUTH_SEO_GOOGLE_CLIENT_ID,
    googleClientSecret: env.AUTH_SEO_GOOGLE_CLIENT_SECRET,
  });

  const gscIntegrationResult = await getGscIntegrationForProject({
    db: args.db,
    projectId: args.projectId,
    organizationId: args.organizationId,
    authOverride: auth,
  });

  if (!gscIntegrationResult.ok) {
    logError("failed to load GSC integration", {
      context: args.context,
      projectId: args.projectId,
      organizationId: args.organizationId,
      error: gscIntegrationResult.error,
    });
    throw gscIntegrationResult.error;
  }

  return gscIntegrationResult.value;
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
        if (!projectResult.ok) throw projectResult.error;
        if (!projectResult.value) {
          throw new NonRetryableError(`Missing project ${input.projectId}`);
        }

        const strategyResult = await getStrategyDetails({
          db,
          projectId: input.projectId,
          strategyId: input.strategyId,
          organizationId: input.organizationId,
        });
        if (!strategyResult.ok) throw strategyResult.error;
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
      if (!unassignedResult.ok) throw unassignedResult.error;

      const combined = new Map<string, DraftTarget>();

      for (const draft of unassignedResult.value) {
        combined.set(draft.id, {
          ...draft,
          source: "unassigned",
        });
      }
      for (const phase of strategy.phases) {
        for (const content of phase.phaseContents) {
          if (!content.contentDraft) continue;
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
        const { tools: webTools } = createWebToolsWithMetadata(
          project,
          this.env.CACHE,
        );
        const dataforseoTools = createDataforseoToolWithMetadata(
          project,
          this.env.CACHE,
        );

        const db = createDb();
        const strategyTools = createStrategyToolsWithMetadata({
          db,
          projectId: project.id,
          organizationId: project.organizationId,
        });

        const gscIntegration = await getGscIntegrationOrThrow({
          db,
          projectId: project.id,
          organizationId: project.organizationId,
          context: "generate phase suggestion",
        });

        const gscTools = createGscToolWithMetadata({
          accessToken: gscIntegration?.accessToken ?? null,
          siteUrl: gscIntegration?.config?.domain ?? null,
          siteType: gscIntegration?.config?.propertyType ?? null,
        });

        const system = `You are an SEO strategist generating the NEXT execution phase for an approved strategy.

## Strategy
Name: ${strategy.name}
Motivation: ${strategy.motivation}
Description: ${strategy.description ?? "(none)"}
Goal: ${formatStrategyGoal(strategy.goal)}

## Historical Context (oldest to newest)
${formatStrategyPhaseHistory(strategy.phases)}

## Rules
- Use tools before deciding what should be improved, expanded, or created.
- Ground decisions in project data (GSC, keyword data, web research, strategy details).
- Use Google Search Console to verify publication and performance before proposing improvements:
  - Query GSC with dimensions ['page', 'query'] when possible.
  - Use includingRegex filters on page to match draft slugs (for example slug 'best-crm-tools' -> regex '.*/best-crm-tools/?$').
  - If a slug has no matching page/query rows over a useful date range, treat it as likely not published or not yet indexed and avoid recommending optimize/expand based on missing evidence.
  - For published pages, inspect clicks, impressions, queries, and position trends before recommending improve/expand actions.
- The phase should be clear, concise, and focused with a clear hypothesis.
- Use contentUpdates for improving/expanding existing drafts when it is warranted.
- Use contentCreations for all net-new content to create in this phase.
- Output JSON matching the provided schema exactly.

## Candidate existing drafts for updates
${formatDraftTargets(candidateDrafts)}`;

        const outputResult = await generateText({
          model: openai("gpt-5.2"),
          system,
          tools: {
            ...webTools,
            ...dataforseoTools.tools,
            ...strategyTools.tools,
            ...(gscIntegration ? gscTools.tools : {}),
          },
          prompt: `Project website: ${project.websiteUrl}
Business background:
${formatBusinessBackground(project.businessBackground)}

Generate the next strategy phase now.`,
          stopWhen: [stepCountIs(40)],
          onStepFinish: (agentStep) => {
            logAgentStep(
              logInfo,
              "phase generation tool step",
              agentStep,
              event.instanceId,
            );
          },
          experimental_output: Output.object({
            schema: jsonSchema<PhaseSuggestion>(
              strategyPhaseSuggestionScheme.toJsonSchema() as JSONSchema7,
            ),
          }),
        }).catch((error) => {
          console.error("error generating phase suggestion", error);
          throw error;
        });

        return outputResult.experimental_output;
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
        now: now,
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
      if (!phaseInsert.ok) throw phaseInsert.error;

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
            "content update draft was not found in candidate set, skipping",
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
          primaryKeyword: contentUpdate.updatedPrimaryKeyword,
        });
        if (!updatedDraft.ok) throw updatedDraft.error;

        const phaseContentResult = await createStrategyPhaseContent(db, {
          phaseId: phase.id,
          contentDraftId: updatedDraft.value.id,
          action: contentUpdate.action,
          plannedPrimaryKeyword:
            contentUpdate.updatedPrimaryKeyword ??
            updatedDraft.value.primaryKeyword,
          role: contentUpdate.updatedRole ?? updatedDraft.value.role,
          notes: contentUpdate.updatedNotes ?? null,
        });
        if (!phaseContentResult.ok) throw phaseContentResult.error;
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
        });
        if (!draftInsert.ok) throw draftInsert.error;

        const phaseContentResult = await createStrategyPhaseContent(db, {
          phaseId: phase.id,
          contentDraftId: draftInsert.value.id,
          action: contentCreation.action,
          plannedSlug: contentCreation.plannedSlug,
          plannedPrimaryKeyword: contentCreation.plannedPrimaryKeyword,
          role: contentCreation.role,
          notes: contentCreation.notes ?? null,
        });
        if (!phaseContentResult.ok) throw phaseContentResult.error;

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
