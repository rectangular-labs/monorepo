import type {
  strategyKeywordUniverseSchema,
  strategyLlmQueriesSchema,
} from "../schemas/keyword-parsers";

type StrategyKeywordUniverse = typeof strategyKeywordUniverseSchema.infer;
type StrategyLlmQueries = typeof strategyLlmQueriesSchema.infer;

export type StrategyKeywordCluster = {
  clusterId: string;
  keywords: StrategyKeywordUniverse["items"];
  coreKeyword: StrategyKeywordUniverse["items"][number] | null;
  llmQueries: StrategyLlmQueries["items"];
};

export function groupKeywordUniverseByCluster(args: {
  keywordUniverse: StrategyKeywordUniverse | null | undefined;
  llmQueries: StrategyLlmQueries | null | undefined;
}) {
  if (!args.keywordUniverse) {
    return [] as StrategyKeywordCluster[];
  }

  const llmQueryById = new Map(
    (args.llmQueries?.items ?? []).map((query) => [query.id, query]),
  );
  const clusters = new Map<string, StrategyKeywordCluster>();

  for (const keyword of args.keywordUniverse.items) {
    const existing = clusters.get(keyword.clusterId);
    const cluster =
      existing ??
      ({
        clusterId: keyword.clusterId,
        keywords: [],
        coreKeyword: null,
        llmQueries: [],
      } satisfies StrategyKeywordCluster);

    cluster.keywords.push(keyword);

    if (keyword.category === "core") {
      cluster.coreKeyword = keyword;
    }

    if (keyword.source.type === "llmQueryFanOut") {
      const query = llmQueryById.get(keyword.source.llmQueryId);
      if (
        query &&
        !cluster.llmQueries.some(
          (existingQuery) => existingQuery.id === query.id,
        )
      ) {
        cluster.llmQueries.push(query);
      }
    }

    clusters.set(keyword.clusterId, cluster);
  }

  return Array.from(clusters.values()).sort((left, right) => {
    const leftCore = left.coreKeyword?.keyword ?? left.clusterId;
    const rightCore = right.coreKeyword?.keyword ?? right.clusterId;
    return leftCore.localeCompare(rightCore);
  });
}
