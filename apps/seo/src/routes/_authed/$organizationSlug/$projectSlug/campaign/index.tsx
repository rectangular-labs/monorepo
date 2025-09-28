import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GridListToggle, useGridListMode } from "~/components/grid-list-toggle";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "../../../-components/loading-error";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/campaign/",
)({
  loader: async ({ context }) => {
    if (!context.activeProject) throw notFound();
    const campaigns = await context.queryClient.ensureQueryData(
      getApiClientRq().campaign.list.queryOptions({
        input: {
          projectId: context.activeProject.id,
        },
      }),
    );
    return { campaigns, activeProject: context.activeProject };
  },
  component: PageComponent,
});

function PageComponent() {
  const [viewMode, setViewMode] = useGridListMode();
  const [searchQuery, setSearchQuery] = useState("");
  const { activeProject } = Route.useLoaderData();
  const {
    data,
    isLoading,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    getApiClientRq().campaign.list.infiniteOptions({
      input: (pageParam) => ({
        projectId: activeProject.id,
        limit: 10,
        cursor: pageParam,
      }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextPageCursor ?? undefined,
    }),
  );

  const allCampaigns: Campaign[] = data?.pages.flatMap((p) => p.data) ?? [];
  const filteredCampaigns = allCampaigns.filter((campaign) =>
    campaign.keywordCategory.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage and monitor your content campaigns
          </p>
        </div>
        <NewCampaignButton />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="max-w-sm flex-1">
          <div className="relative">
            <Icons.Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
              }}
              placeholder="Search campaigns..."
              value={searchQuery}
            />
          </div>
        </div>

        <GridListToggle onChange={setViewMode} value={viewMode} />
      </div>

      <LoadingError
        error={error}
        errorDescription="Something went wrong while loading campaigns. Please try again."
        errorTitle="Error loading campaigns"
        isLoading={isLoading}
        loadingComponent={<CampaignSkeletons viewMode={viewMode} />}
        onRetry={refetch}
      />

      {!isLoading && filteredCampaigns.length === 0 && (
        <EmptyState searchQuery={searchQuery} />
      )}

      {!isLoading && filteredCampaigns.length > 0 && (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-4",
          )}
        >
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              campaign={campaign}
              key={campaign.id}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-6">
          <Button
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            variant="outline"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}

type Campaign = RouterOutputs["campaign"]["list"]["data"][0];
function CampaignCard({
  campaign,
  viewMode,
}: {
  campaign: Campaign;
  viewMode: "grid" | "list";
}) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  if (viewMode === "list") {
    return (
      <Card className="relative transition-all duration-200 hover:bg-muted/50 hover:shadow-md">
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-muted">
                  <Icons.Folder className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="truncate font-semibold text-lg">
                  {campaign.keywordCategory}
                </CardTitle>
                <p className="truncate text-muted-foreground text-sm">
                  ID: {campaign.id}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 text-right text-muted-foreground text-sm">
              <p>Updated {formatDate(campaign.updatedAt)}</p>
              <p>Created {formatDate(campaign.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative transition-all duration-200 hover:bg-muted/50 hover:shadow-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-muted">
              <Icons.Folder className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="truncate font-semibold text-lg">
              {campaign.keywordCategory}
            </CardTitle>
            <p className="truncate text-muted-foreground text-sm">
              ID: {campaign.id}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-muted-foreground text-sm">
          <span>Updated {formatDate(campaign.updatedAt)}</span>
          <Icons.ArrowRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignSkeletons({ viewMode }: { viewMode: "grid" | "list" }) {
  const skeletons = Array.from({ length: 6 }, (_, i) => i);

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {skeletons.map((i) => (
          <Card key={i}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <Skeleton className="h-8 w-8 flex-shrink-0 rounded-sm" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <div className="flex-shrink-0 space-y-1 text-right">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {skeletons.map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 flex-shrink-0 rounded-sm" />
              <div className="min-w-0 flex-1 space-y-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icons.Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mb-2 font-semibold text-lg">
        {searchQuery ? "No campaigns found" : "No campaigns yet"}
      </h3>
      <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
        {searchQuery
          ? `No campaigns match "${searchQuery}". Try adjusting your search.`
          : "Get started by creating your first campaign."}
      </p>
      {!searchQuery && <NewCampaignButton />}
    </div>
  );
}
function NewCampaignButton() {
  const navigate = useNavigate();
  return (
    <Button
      onClick={() =>
        void navigate({
          from: "/$organizationSlug/$projectSlug/campaign",
          to: "/$organizationSlug/$projectSlug/campaign/create",
        })
      }
    >
      <Icons.Plus className="mr-2 h-4 w-4" />
      New Campaign
    </Button>
  );
}
