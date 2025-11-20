"use client";

import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { useDebounce } from "@rectangular-labs/ui/hooks/use-debounce";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "../../-components/loading-error";

type Campaign = RouterOutputs["campaigns"]["list"]["data"][0];
type CampaignsSidebarProps = {
  projectId: string;
  organizationId: string;
  currentCampaign: Campaign;
};

export function CampaignsSidebar({
  projectId,
  organizationId,
  currentCampaign,
}: CampaignsSidebarProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    refetch,
    error,
  } = useInfiniteQuery(
    getApiClientRq().campaigns.list.infiniteOptions({
      input: (pageParam) => ({
        organizationId,
        projectId,
        limit: 20,
        cursor: pageParam,
        search: debouncedSearch || undefined,
      }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextPageCursor ?? undefined,
    }),
  );
  const campaigns = data?.pages.flatMap((p) => p.data) ?? [];

  const displayCampaigns = useMemo(() => {
    if (search) return campaigns;
    if (campaigns.some((c) => c.id === currentCampaign.id)) return campaigns;

    const withCurrent = [...campaigns, currentCampaign];
    withCurrent.sort((a, b) => b.id.localeCompare(a.id));
    return withCurrent;
  }, [campaigns, currentCampaign, search]);

  return (
    <div className="flex h-full flex-col rounded-md bg-background">
      <div className="flex flex-col items-center gap-2 border-b p-3">
        <div className="relative w-full">
          <Icons.Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Search campaigns..."
            value={search}
          />
        </div>
        <NewCampaignButton
          organizationId={organizationId}
          projectId={projectId}
        />
      </div>
      <div className="flex-1 divide-y overflow-auto">
        <LoadingError
          error={error}
          isLoading={isLoading}
          loadingComponent={<CampaignSkeletons />}
          onRetry={refetch}
        />
        {!isLoading && !error && displayCampaigns.length === 0 && (
          <div className="px-3 py-2 text-muted-foreground text-sm">
            No campaigns
          </div>
        )}
        {!isLoading && !error && displayCampaigns.length > 0 && (
          <ul className="divide-y">
            {displayCampaigns.map((c) => (
              <CampaignsSidebarItem campaign={c} key={c.id} />
            ))}
          </ul>
        )}
        {isFetchingNextPage && <CampaignSkeletons />}
        {hasNextPage && (
          <div className="flex justify-center py-2">
            <Button
              className="text-xs"
              disabled={isFetchingNextPage}
              onClick={() => fetchNextPage()}
              size="sm"
              variant="ghost"
            >
              {isFetchingNextPage ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignsSidebarItem({ campaign }: { campaign: Campaign }) {
  return (
    <li>
      <Link
        activeProps={{
          className: "bg-accent",
        }}
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-accent"
        from="/$organizationSlug/$projectSlug/campaign/$campaignId"
        params={{
          campaignId: campaign.id,
        }}
        to="/$organizationSlug/$projectSlug/campaign/$campaignId"
      >
        <span className="truncate text-sm">{campaign.title}</span>
        <span className="ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-muted-foreground text-xs">
          <Icons.Dot className="-ml-1 h-3 w-3" />
          {campaign.status}
        </span>
      </Link>
    </li>
  );
}

function CampaignSkeletons() {
  return (
    <ul className="divide-y">
      {Array.from({ length: 5 }).map((_, i) => {
        const widthPercent = 45 + Math.floor(Math.random() * 20);
        return (
          <li
            className="px-3 py-2"
            // biome-ignore lint/suspicious/noArrayIndexKey: loading skeleton
            key={`campaign-skeleton-${i}`}
          >
            <Skeleton className="h-5" style={{ width: `${widthPercent}%` }} />
          </li>
        );
      })}
    </ul>
  );
}

function NewCampaignButton({
  organizationId,
  projectId,
}: {
  organizationId: string;
  projectId: string;
}) {
  const navigate = useNavigate();
  const { organizationSlug, projectSlug } = useParams({
    from: "/_authed/$organizationSlug_/$projectSlug/campaign/$campaignId",
  });
  const { mutate: createCampaign, isPending } = useMutation(
    getApiClientRq().campaigns.create.mutationOptions({
      onSuccess: (data) => {
        toast.success("Campaign created");
        void navigate({
          to: "/$organizationSlug/$projectSlug/campaign/$campaignId",
          params: { organizationSlug, projectSlug, campaignId: data.id },
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );
  return (
    <Button
      className="w-full min-w-0 truncate"
      isLoading={isPending}
      onClick={() =>
        createCampaign({ organizationId: organizationId, projectId: projectId })
      }
      variant="outline"
    >
      <Icons.Plus className="h-4 w-4" />
      New Campaign
    </Button>
  );
}
