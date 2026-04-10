import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import type {
  seoGenerateStrategyDraftsTaskInputSchema,
  seoGenerateStrategyDraftsTaskOutputSchema,
} from "@rectangular-labs/core/schemas/task-parsers";
import { groupKeywordsBySerpOverlap } from "@rectangular-labs/core/strategy/group-keywords-by-serp-overlap";
import { createDb } from "@rectangular-labs/db";
import {
  createContentDraft,
  getSeoProjectById,
  getStrategyDetails,
  listContentDraftsWithLatestSnapshot,
  validateSlug,
} from "@rectangular-labs/db/operations";
import type { type } from "arktype";
import { normalizeContentSlug } from "../lib/content/normalize-content-slug";
import { writeContentDraft } from "../lib/content/write-content-draft";
import {
  configureDataForSeoClient,
  fetchSerpWithCache,
  getLocationAndLanguage,
} from "../lib/dataforseo/utils";
import type { InitialContext } from "../types";

function logInfo(message: string, data?: Record<string, unknown>) {
  console.info(`[SeoStrategyDraftPlanningWorkflow] ${message}`, data ?? {});
}

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase();
}

function getOrganicSerpUrls(
  searchResult: Array<{ type: string; url?: string | null }>,
) {
  return Array.from(
    new Set(
      searchResult
        .filter((item) => item.type === "organic" && !!item.url)
        .map((item) => item.url)
        .filter((url): url is string => Boolean(url))
        .slice(0, 12),
    ),
  );
}

async function mapWithConcurrency<TInput, TOutput>(args: {
  items: TInput[];
  concurrency: number;
  mapper: (item: TInput, index: number) => Promise<TOutput>;
}) {
  const results: TOutput[] = new Array(args.items.length);
  let currentIndex = 0;

  const workers = Array.from({
    length: Math.max(1, Math.min(args.concurrency, args.items.length)),
  }).map(async () => {
    while (currentIndex < args.items.length) {
      const itemIndex = currentIndex;
      currentIndex += 1;
      const item = args.items[itemIndex];
      if (item === undefined) continue;
      results[itemIndex] = await args.mapper(item, itemIndex);
    }
  });

  await Promise.all(workers);

  return results;
}

async function resolveAvailableSlug(args: {
  db: ReturnType<typeof createDb>;
  organizationId: string;
  projectId: string;
  baseKeyword: string;
}) {
  const baseSlug = normalizeContentSlug(`/${args.baseKeyword}`);

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidateSlug =
      attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const validationResult = await validateSlug({
      db: args.db,
      organizationId: args.organizationId,
      projectId: args.projectId,
      slug: candidateSlug,
      ignoreDraftId: undefined,
      ignoreOriginatingDraftId: undefined,
    });
    if (!validationResult.ok) {
      throw validationResult.error;
    }
    if (validationResult.value.valid) {
      return candidateSlug;
    }
  }

  throw new Error(
    `Could not resolve an available slug for ${args.baseKeyword}`,
  );
}

type StrategyDraftPlanningInput = type.infer<
  typeof seoGenerateStrategyDraftsTaskInputSchema
>;
type DraftPlanningGroup = {
  keywords: string[];
  coreKeyword: string;
  secondaryKeywords: string[];
  existingDraftId: string | null;
};

export type SeoStrategyDraftPlanningWorkflowBinding =
  Workflow<StrategyDraftPlanningInput>;

export class SeoStrategyDraftPlanningWorkflow extends WorkflowEntrypoint<
  {
    CACHE: InitialContext["cacheKV"];
  },
  StrategyDraftPlanningInput
> {
  async run(
    event: WorkflowEvent<StrategyDraftPlanningInput>,
    step: WorkflowStep,
  ): Promise<type.infer<typeof seoGenerateStrategyDraftsTaskOutputSchema>> {
    const input = event.payload;

    logInfo("start", {
      instanceId: event.instanceId,
      strategyId: input.strategyId,
      organizationId: input.organizationId,
      projectId: input.projectId,
    });

    const planningContext = await step.do(
      "load strategy planning context",
      async () => {
        const db = createDb();

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
          throw new NonRetryableError(`Strategy ${input.strategyId} not found`);
        }

        const projectResult = await getSeoProjectById(db, input.projectId);
        if (!projectResult.ok) {
          throw projectResult.error;
        }
        if (!projectResult.value) {
          throw new NonRetryableError(`Project ${input.projectId} not found`);
        }

        const draftsResult = await listContentDraftsWithLatestSnapshot({
          db,
          organizationId: input.organizationId,
          projectId: input.projectId,
          strategyId: input.strategyId,
        });
        if (!draftsResult.ok) {
          throw draftsResult.error;
        }

        const activeKeywordItems =
          strategyResult.value.keywordUniverse?.items.filter(
            (item) => item.status === "active",
          ) ?? [];

        const targetedKeywordSet = new Set(
          draftsResult.value.flatMap((draft) =>
            [draft.primaryKeyword, ...draft.secondaryKeywords].map(
              normalizeKeyword,
            ),
          ),
        );
        const normalizedActiveKeywordItems = activeKeywordItems.map((item) => ({
          ...item,
          keyword: normalizeKeyword(item.keyword),
        }));
        const netNewKeywordItems = normalizedActiveKeywordItems.filter(
          (item) => !targetedKeywordSet.has(item.keyword),
        );

        return {
          project: projectResult.value,
          strategyDrafts: draftsResult.value,
          activeKeywordItems: normalizedActiveKeywordItems,
          netNewKeywordItems,
        };
      },
    );

    if (planningContext.netNewKeywordItems.length === 0) {
      return {
        type: "seo-generate-strategy-drafts",
        strategyId: input.strategyId,
        createdDraftIds: [],
        queuedDraftIds: [],
      };
    }

    const serpKeywords = Array.from(
      new Set(
        planningContext.activeKeywordItems.map((item) => item.keyword.trim()),
      ),
    );

    const serpResults = await step.do(
      "fetch keyword serps",
      { timeout: "10 minutes" },
      async () => {
        configureDataForSeoClient();
        const { locationName, languageCode } = getLocationAndLanguage(
          planningContext.project,
        );

        const rows = await mapWithConcurrency({
          items: serpKeywords,
          concurrency: 5,
          mapper: async (keyword) => {
            const serpResult = await fetchSerpWithCache({
              keyword,
              locationName,
              languageCode,
              cacheKV: this.env.CACHE,
              depth: 10,
            });
            if (!serpResult.ok) {
              throw serpResult.error;
            }
            return {
              keyword,
              urls: getOrganicSerpUrls(serpResult.value.searchResult),
            };
          },
        });
        console.log("rows", JSON.stringify(rows, null, 2));

        return { rows };
      },
    );

    const planningResult = (await step.do(
      "plan uncovered draft groups",
      async (): Promise<DraftPlanningGroup[]> => {
        const keywordOrder = new Map(
          planningContext.activeKeywordItems.map((item, index) => [
            item.keyword,
            index,
          ]),
        );

        const groupedKeywords = groupKeywordsBySerpOverlap({
          items: serpResults.rows,
          minOverlapScore: 0.5,
        });
        console.log(
          "groupedKeywords",
          JSON.stringify(groupedKeywords, null, 2),
        );

        const draftByTargetedKeyword = new Map<string, string>();
        for (const draft of planningContext.strategyDrafts) {
          for (const keyword of [
            draft.primaryKeyword,
            ...draft.secondaryKeywords,
          ]) {
            draftByTargetedKeyword.set(normalizeKeyword(keyword), draft.id);
          }
        }

        const groups = groupedKeywords.groups
          .map((groupKeywords) => {
            const normalizedGroupKeywords = new Set(
              groupKeywords.map(normalizeKeyword),
            );
            const strategyItemsInGroup = planningContext.activeKeywordItems
              .filter((item) => normalizedGroupKeywords.has(item.keyword))
              .sort((left, right) => {
                const leftOrder =
                  keywordOrder.get(left.keyword) ?? Number.MAX_SAFE_INTEGER;
                const rightOrder =
                  keywordOrder.get(right.keyword) ?? Number.MAX_SAFE_INTEGER;
                return leftOrder - rightOrder;
              });

            if (strategyItemsInGroup.length === 0) {
              return null;
            }

            const coreKeyword =
              strategyItemsInGroup.find((item) => item.category === "core") ??
              strategyItemsInGroup[0];

            if (!coreKeyword) {
              return null;
            }

            const existingDraftId = groupKeywords
              .map((keyword) =>
                draftByTargetedKeyword.get(normalizeKeyword(keyword)),
              )
              .find((draftId) => !!draftId);

            return {
              keywords: strategyItemsInGroup.map((item) => item.keyword),
              coreKeyword: coreKeyword.keyword,
              secondaryKeywords: strategyItemsInGroup
                .map((item) => item.keyword)
                .filter(
                  (keyword) =>
                    normalizeKeyword(keyword) !==
                    normalizeKeyword(coreKeyword.keyword),
                ),
              existingDraftId: existingDraftId ?? null,
            };
          })
          .filter(
            (group): group is NonNullable<typeof group> => group !== null,
          );

        console.log("groups", JSON.stringify(groups, null, 2));

        const uncoveredCoreKeywords = new Set(
          planningContext.netNewKeywordItems
            .filter((item) => item.category === "core")
            .map((item) => item.keyword),
        );
        console.log(
          "uncoveredCoreKeywords",
          JSON.stringify(Array.from(uncoveredCoreKeywords.entries()), null, 2),
        );

        return await Promise.resolve(
          groups.filter((group) => {
            if (group.existingDraftId) {
              return false;
            }

            return uncoveredCoreKeywords.has(
              normalizeKeyword(group.coreKeyword),
            );
          }),
        );
      },
    )) as DraftPlanningGroup[];

    const createdDraftIds = await step.do(
      "create and queue missing drafts",
      async () => {
        const db = createDb();
        const draftIds: string[] = [];

        for (const group of planningResult) {
          const slug = await resolveAvailableSlug({
            db,
            organizationId: input.organizationId,
            projectId: input.projectId,
            baseKeyword: group.coreKeyword,
          });

          const draftResult = await createContentDraft(db, {
            organizationId: input.organizationId,
            projectId: input.projectId,
            strategyId: input.strategyId,
            slug,
            title: group.coreKeyword,
            primaryKeyword: group.coreKeyword,
            secondaryKeywords: group.secondaryKeywords,
            role: "pillar",
          });
          if (!draftResult.ok) {
            throw draftResult.error;
          }

          const queuedResult = await writeContentDraft({
            db,
            chatId: null,
            userId: input.userId ?? null,
            projectId: input.projectId,
            organizationId: input.organizationId,
            lookup: { type: "id", id: draftResult.value.id },
            draftNewValues: {
              status: "queued",
            },
          });
          if (!queuedResult.ok) {
            throw queuedResult.error;
          }

          draftIds.push(draftResult.value.id);
        }

        return draftIds;
      },
    );

    logInfo("complete", {
      strategyId: input.strategyId,
      createdDraftCount: createdDraftIds.length,
    });

    return {
      type: "seo-generate-strategy-drafts",
      strategyId: input.strategyId,
      createdDraftIds,
      queuedDraftIds: createdDraftIds,
    };
  }
}
