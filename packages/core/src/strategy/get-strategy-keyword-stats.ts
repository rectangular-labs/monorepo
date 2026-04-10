import type {
  strategyKeywordUniverseSchema,
  strategyLlmQueriesSchema,
} from "../schemas/keyword-parsers";
import { groupKeywordUniverseByCluster } from "./group-keyword-universe-by-cluster";

type StrategyKeywordUniverse = typeof strategyKeywordUniverseSchema.infer;
type StrategyLlmQueries = typeof strategyLlmQueriesSchema.infer;

export function getStrategyKeywordStats(args: {
  keywordUniverse: StrategyKeywordUniverse | null | undefined;
  llmQueries: StrategyLlmQueries | null | undefined;
}) {
  const activeKeywords =
    args.keywordUniverse?.items.filter(
      (item) => item.status === "active" && item.category !== "fanOut",
    ) ?? [];
  const activeQueries =
    args.llmQueries?.items.filter((item) => item.status === "active") ?? [];
  const clusters = groupKeywordUniverseByCluster(args).filter((cluster) =>
    cluster.keywords.some((keyword) => keyword.status === "active"),
  );

  return {
    activeKeywords,
    activeQueries,
    clusters,
    totalSearchVolume: activeKeywords.reduce(
      (sum, keyword) => sum + (keyword.searchVolume ?? 0),
      0,
    ),
  };
}
