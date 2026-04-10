import { formatNullableNumber } from "@rectangular-labs/core/format/number";
import type { getStrategyKeywordStats } from "@rectangular-labs/core/strategy/get-strategy-keyword-stats";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { PopoverTooltip } from "@rectangular-labs/ui/components/ui/popover-tooltip";

type StrategyKeywordStats = ReturnType<typeof getStrategyKeywordStats>;
type StrategyKeyword = StrategyKeywordStats["activeKeywords"][number];

export function StrategyKeywordSections({
  keywordStats,
}: {
  keywordStats: StrategyKeywordStats;
}) {
  if (
    keywordStats.activeKeywords.length === 0 &&
    keywordStats.activeQueries.length === 0
  ) {
    return null;
  }

  return (
    <>
      {keywordStats.activeKeywords.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {keywordStats.clusters.length > 1
              ? `Keyword Clusters (${keywordStats.clusters.length})`
              : "Keyword Cluster"}
          </p>
          <div className="space-y-2">
            {keywordStats.clusters.map((cluster) => {
              const clusterKeywords = cluster.keywords.filter(
                (keyword) => keyword.status === "active",
              );
              const totalVolume = clusterKeywords.reduce(
                (sum, keyword) => sum + (keyword.searchVolume ?? 0),
                0,
              );

              return (
                <div className="rounded-md border p-3" key={cluster.clusterId}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-sm">
                      {cluster.coreKeyword?.keyword ?? "Untitled cluster"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
                      <span>{clusterKeywords.length} keywords</span>
                      <span>
                        Raw volume{" "}
                        {formatNullableNumber(totalVolume, { fallback: "n/a" })}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {clusterKeywords.map((keyword) => (
                      <StrategyKeywordBadge
                        key={keyword.id}
                        keyword={keyword}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {keywordStats.activeQueries.length > 0 && (
        <div className="space-y-1">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {`LLM Queries (${keywordStats.activeQueries.length})`}
          </p>
          <div className="space-y-2">
            {keywordStats.activeQueries.map((query) => (
              <div className="rounded-md border p-3" key={query.id}>
                <p className="text-sm">{query.query}</p>
                {query.rationale ? (
                  <p className="mt-1 text-muted-foreground text-xs">
                    {query.rationale}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function StrategyKeywordBadge({ keyword }: { keyword: StrategyKeyword }) {
  return (
    <Badge variant={keyword.category === "core" ? "default" : "outline"}>
      {keyword.keyword}
      <PopoverTooltip
        content={<StrategyKeywordDetails keyword={keyword} />}
        contentClassName="border border-border bg-popover text-popover-foreground shadow-md"
      >
        <button
          aria-label={`View details for ${keyword.keyword}`}
          className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          type="button"
        >
          <Icons.Info className="size-3.5" />
        </button>
      </PopoverTooltip>
    </Badge>
  );
}

function StrategyKeywordDetails({ keyword }: { keyword: StrategyKeyword }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium">{keyword.keyword}</p>
      <p className="text-muted-foreground">
        Role: {keyword.category === "core" ? "Core" : "Supporting"}
      </p>
      <p className="text-muted-foreground">Intent: {keyword.intent ?? "n/a"}</p>
      <p className="text-muted-foreground">
        Volume:{" "}
        {formatNullableNumber(keyword.searchVolume, { fallback: "n/a" })}
      </p>
      <p className="text-muted-foreground">
        Difficulty:{" "}
        {formatNullableNumber(keyword.difficulty, { fallback: "n/a" })}
      </p>
      <p className="text-muted-foreground">
        CPC:{" "}
        {keyword.cpc !== null && keyword.cpc !== undefined
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(keyword.cpc)
          : "n/a"}
      </p>
    </div>
  );
}
