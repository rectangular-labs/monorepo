import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { initAuthHandler } from "@rectangular-labs/auth";
import type {
  KeywordSnapshot,
  SnapshotAggregate,
} from "@rectangular-labs/core/schemas/strategy-parsers";
import type {
  seoGenerateStrategySnapshotTaskInputSchema,
  seoGenerateStrategySnapshotTaskOutputSchema,
} from "@rectangular-labs/core/schemas/task-parsers";
import { createDb } from "@rectangular-labs/db";
import {
  createStrategySnapshot,
  createStrategySnapshotContent,
  getLatestStrategySnapshot,
  getSeoProjectById,
  getStrategyDetails,
} from "@rectangular-labs/db/operations";
import {
  getLastNDaysRange,
  getSearchAnalytics,
} from "@rectangular-labs/google-apis/google-search-console";
import { apiEnv } from "../env";
import { getGscIntegrationForProject } from "../lib/database/gsc-integration";

function logInfo(message: string, data?: Record<string, unknown>) {
  console.info(`[SeoStrategySnapshotWorkflow] ${message}`, data ?? {});
}

function logError(message: string, data?: Record<string, unknown>) {
  console.error(`[SeoStrategySnapshotWorkflow] ${message}`, data ?? {});
}

type StrategySnapshotInput =
  typeof seoGenerateStrategySnapshotTaskInputSchema.infer;
export type SeoStrategySnapshotWorkflowBinding =
  Workflow<StrategySnapshotInput>;

type StrategySnapshotOutput =
  typeof seoGenerateStrategySnapshotTaskOutputSchema.infer;

type StrategyDetails = NonNullable<
  Awaited<ReturnType<typeof getStrategyDetails>> extends infer T
    ? T extends { ok: true; value: infer V }
      ? V
      : never
    : never
>;

type SnapshotItem = {
  draftId: string;
  aggregate: SnapshotAggregate;
  topKeywords: KeywordSnapshot[];
};

function buildPageUrl(baseUrl: string, slug: string) {
  try {
    return new URL(slug, baseUrl).href;
  } catch {
    return null;
  }
}

function computeAggregate(items: SnapshotItem[]): SnapshotAggregate {
  const clicks = items.reduce((sum, item) => sum + item.aggregate.clicks, 0);
  const impressions = items.reduce(
    (sum, item) => sum + item.aggregate.impressions,
    0,
  );
  const weightedPosition = items.reduce(
    (sum, item) =>
      sum + item.aggregate.avgPosition * item.aggregate.impressions,
    0,
  );
  const avgPosition = impressions > 0 ? weightedPosition / impressions : 0;

  return {
    clicks,
    impressions,
    avgPosition,
  };
}

function computeDelta(
  current: SnapshotAggregate,
  previous: SnapshotAggregate | null,
): SnapshotAggregate | null {
  if (!previous) return null;
  return {
    clicks: current.clicks - previous.clicks,
    impressions: current.impressions - previous.impressions,
    avgPosition: current.avgPosition - previous.avgPosition,
  };
}

function getEmptySnapshotAggregate(): SnapshotAggregate {
  return {
    clicks: 0,
    impressions: 0,
    avgPosition: 0,
  };
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

function getDraftTargets(args: {
  strategy: StrategyDetails;
  phaseId: string | null | undefined;
}) {
  const selectedPhases = args.phaseId
    ? args.strategy.phases.filter((phase) => phase.id === args.phaseId)
    : args.strategy.phases;

  const draftMap = new Map<
    string,
    Pick<
      NonNullable<
        StrategyDetails["phases"][number]["phaseContents"][number]["contentDraft"]
      >,
      "id" | "slug"
    >
  >();

  for (const phase of selectedPhases) {
    for (const content of phase.phaseContents) {
      if (!content.contentDraft) continue;
      draftMap.set(content.contentDraft.id, {
        id: content.contentDraft.id,
        slug: content.contentDraft.slug,
      });
    }
  }

  return {
    selectedPhasesCount: selectedPhases.length,
    drafts: Array.from(draftMap.values()),
  };
}

export class SeoStrategySnapshotWorkflow extends WorkflowEntrypoint<
  {
    CACHE: KVNamespace;
  },
  StrategySnapshotInput
> {
  async run(event: WorkflowEvent<StrategySnapshotInput>, step: WorkflowStep) {
    const input = event.payload;

    logInfo("start", {
      instanceId: event.instanceId,
      projectId: input.projectId,
      strategyId: input.strategyId,
      phaseId: input.phaseId ?? null,
      triggerType: input.triggerType,
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

    const snapshotId = await step.do("create snapshot", async () => {
      const db = createDb();
      const gscIntegration = await getGscIntegrationOrThrow({
        db,
        projectId: project.id,
        organizationId: project.organizationId,
        context: "create snapshot",
      });

      if (!gscIntegration) {
        logInfo("skip snapshot, no GSC integration", {
          strategyId: strategy.id,
          projectId: project.id,
        });
        return null;
      }

      const draftTargets = getDraftTargets({
        strategy,
        phaseId: input.phaseId,
      });
      logInfo("draft targets", {
        strategyId: strategy.id,
        projectId: project.id,
        phaseId: input.phaseId,
        draftTargets: draftTargets,
      });
      if (input.phaseId && draftTargets.selectedPhasesCount === 0) {
        logInfo("skip snapshot, no selected phases", {
          strategyId: strategy.id,
          projectId: project.id,
          phaseId: input.phaseId,
        });
        throw new NonRetryableError(`Missing phase ${input.phaseId}`);
      }

      const snapshotItems: SnapshotItem[] = [];
      const { startDate, endDate } = getLastNDaysRange(7);

      try {
        for (const draft of draftTargets.drafts) {
          const pageUrl = buildPageUrl(project.websiteUrl, draft.slug);
          if (!pageUrl) {
            snapshotItems.push({
              draftId: draft.id,
              aggregate: getEmptySnapshotAggregate(),
              topKeywords: [],
            });
            continue;
          }

          const gscResult = await getSearchAnalytics(
            gscIntegration.accessToken,
            {
              siteUrl: gscIntegration.config.domain,
              siteType: gscIntegration.config.propertyType,
              startDate,
              endDate,
              dimensions: ["query"],
              filters: [
                {
                  dimension: "page",
                  operator: "equals",
                  expression: pageUrl,
                },
              ],
              // todo: handle if user page ranks for more than 2500 keywords
              rowLimit: 2_500,
            },
          );

          if (!gscResult.ok) {
            logError("GSC query failed", {
              draftId: draft.id,
              pageUrl,
              error: gscResult.error,
            });
            snapshotItems.push({
              draftId: draft.id,
              aggregate: getEmptySnapshotAggregate(),
              topKeywords: [],
            });
            continue;
          }
          logInfo("GSC query success", {
            draftId: draft.id,
            pageUrl,
            gscResult: gscResult.value,
          });
          const rows = gscResult.value.rows ?? [];
          const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
          const impressions = rows.reduce(
            (sum, row) => sum + row.impressions,
            0,
          );
          const weightedPosition = rows.reduce(
            (sum, row) => sum + row.position * row.impressions,
            0,
          );
          const avgPosition =
            impressions > 0 ? weightedPosition / impressions : 0;

          snapshotItems.push({
            draftId: draft.id,
            aggregate: {
              clicks,
              impressions,
              avgPosition,
            },
            topKeywords: rows
              .sort((a, b) => b.clicks - a.clicks)
              .slice(0, 100)
              .map((row) => ({
                keyword: row.keys[0] ?? "",
                position: row.position,
                clicks: row.clicks,
                impressions: row.impressions,
              }))
              .filter((row) => !!row.keyword),
          });
        }

        const aggregate = computeAggregate(snapshotItems);
        const latestSnapshotResult = await getLatestStrategySnapshot({
          db,
          strategyId: strategy.id,
        });
        logInfo("latest snapshot", {
          strategyId: strategy.id,
          phaseId: input.phaseId ?? null,
          latestSnapshotId: latestSnapshotResult ?? null,
        });
        if (!latestSnapshotResult.ok) throw latestSnapshotResult.error;

        const delta = computeDelta(
          aggregate,
          latestSnapshotResult.value?.aggregate ?? null,
        );

        const snapshotInsert = await createStrategySnapshot(db, {
          strategyId: strategy.id,
          phaseId: input.phaseId ?? null,
          takenAt: new Date(),
          triggerType: input.triggerType,
          aggregate,
          delta,
          aiInsight: null,
        });
        if (!snapshotInsert.ok) throw snapshotInsert.error;

        const snapshotContentResult = await createStrategySnapshotContent(
          db,
          snapshotItems.map((item) => ({
            snapshotId: snapshotInsert.value.id,
            contentDraftId: item.draftId,
            aggregate: item.aggregate,
            delta: null,
            topKeywords: item.topKeywords,
          })),
        );
        if (!snapshotContentResult.ok) throw snapshotContentResult.error;

        return snapshotInsert.value.id;
      } catch (error) {
        logError("snapshot failed", {
          strategyId: strategy.id,
          phaseId: input.phaseId ?? null,
          error,
        });
        throw error;
      }
    });

    logInfo("complete", {
      instanceId: event.instanceId,
      projectId: input.projectId,
      strategyId: strategy.id,
      phaseId: input.phaseId ?? null,
      triggerType: input.triggerType,
      snapshotId,
    });

    return {
      type: "seo-generate-strategy-snapshot",
      strategyId: strategy.id,
      snapshotId,
    } satisfies StrategySnapshotOutput;
  }
}
