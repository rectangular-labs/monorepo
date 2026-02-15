import * as Icons from "@rectangular-labs/ui/components/icon";
import { useQuery } from "@tanstack/react-query";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import {
  ContentTable,
  type ContentTableSortBy,
  type SortOrder,
} from "../../-components/content-table";
import { useDownloadMutation } from "../../-hooks/use-download-mutation";

type StrategyContentSortBy = Exclude<ContentTableSortBy, "strategy">;

export function StrategyContentTab({
  organizationIdentifier,
  projectId,
  projectSlug,
  strategyId,
  selectedContentDraftId,
  sortBy,
  sortOrder,
  onChangeSort,
  onChangeSortOrder,
  onOpenContentDetails,
}: {
  organizationIdentifier: string;
  projectId: string;
  projectSlug: string;
  strategyId: string;
  selectedContentDraftId: string | null;
  sortBy: StrategyContentSortBy | null;
  sortOrder: SortOrder;
  onChangeSort: (sortBy: StrategyContentSortBy | null) => void;
  onChangeSortOrder: (sortOrder: SortOrder) => void;
  onOpenContentDetails: (contentDraftId: string) => void;
}) {
  const api = getApiClientRq();
  const contentListQuery = useQuery(
    api.content.list.queryOptions({
      input: {
        organizationIdentifier,
        projectId,
        strategyId,
      },
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 60,
    }),
  );

  const downloadMutation = useDownloadMutation({
    organizationIdentifier,
    projectId,
    projectSlug,
  });

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        Click a row to inspect top keywords, keyword overview, and trend.
      </p>

      <LoadingError
        error={contentListQuery.error}
        errorDescription="Could not load content snapshot rows."
        errorTitle="Error loading content"
        isLoading={contentListQuery.isLoading}
        loadingComponent={<Icons.Spinner className="size-4 animate-spin" />}
        onRetry={contentListQuery.refetch}
      />

      {!contentListQuery.isLoading && !contentListQuery.error && (
        <ContentTable
          isDownloadingSelected={downloadMutation.isPending}
          onChangeSort={(nextSortBy) => {
            if (nextSortBy === "strategy") return;
            onChangeSort(nextSortBy);
          }}
          onChangeSortOrder={onChangeSortOrder}
          onDownloadSelected={async (contentDraftIds) => {
            await downloadMutation.mutateAsync(contentDraftIds);
          }}
          onOpenContentDetails={onOpenContentDetails}
          rows={contentListQuery.data?.rows ?? []}
          selectedContentDraftId={selectedContentDraftId}
          showStrategyColumn={false}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      )}
    </div>
  );
}
