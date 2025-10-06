import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rectangular-labs/ui/components/ui/select";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import { cn } from "@rectangular-labs/ui/utils/cn";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { GridListToggle, useGridListMode } from "~/components/grid-list-toggle";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/articles/",
)({
  loader: async ({ context, params }) => {
    const activeProject = await context.queryClient.ensureQueryData(
      getApiClientRq().project.get.queryOptions({
        input: {
          organizationIdentifier: params.organizationSlug,
          identifier: params.projectSlug,
        },
      }),
    );
    if (!activeProject) throw notFound();
    const campaigns = await context.queryClient.ensureInfiniteQueryData(
      getApiClientRq().content.list.infiniteOptions({
        input: (pageParam) => ({
          projectId: activeProject?.id ?? "",
          cursor: pageParam,
          limit: 10,
        }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextPageCursor ?? undefined,
      }),
    );
    return { campaigns, activeProject };
  },
  component: PageComponent,
});

function PageComponent() {
  const [viewMode, setViewMode] = useGridListMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [campaignTypeFilter, setCampaignTypeFilter] = useState<
    "all" | "do-nothing" | "improvement" | "new-content"
  >("all");
  const { organizationSlug, projectSlug } = Route.useParams();
  const {
    data: activeProject,
    isLoading: isLoadingActiveProject,
    error: errorActiveProject,
  } = useQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );
  console.log("activeProject", activeProject);
  const { data: overview, isLoading: isLoadingOverview } = useQuery(
    getApiClientRq().content.overview.queryOptions({
      input: {
        projectId: activeProject?.id ?? "",
      },
      enabled: !!activeProject?.id,
    }),
  );

  const {
    data,
    isLoading,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    getApiClientRq().content.list.infiniteOptions({
      input: (pageParam) => ({
        projectId: activeProject?.id ?? "",
        limit: 10,
        cursor: pageParam,
        campaignType:
          campaignTypeFilter === "all" ? undefined : campaignTypeFilter,
      }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextPageCursor ?? undefined,
      enabled:
        !!activeProject?.id && !isLoadingActiveProject && !errorActiveProject,
    }),
  );

  const allCampaigns: Campaign[] = data?.pages.flatMap((p) => p.data) ?? [];
  const filteredCampaigns = allCampaigns.filter((campaign) =>
    campaign.pathname.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Content</h1>
          <p className="text-muted-foreground">
            Manage and monitor your content campaigns
          </p>
        </div>
        <NewCampaignButton projectId={activeProject?.id ?? ""} />
      </div>

      {/* Overview Stats */}
      {isLoadingOverview ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Loading states
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Total Content
              </CardTitle>
              <Icons.FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{overview.totalContent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Ranking Pages
              </CardTitle>
              <Icons.TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{overview.rankingPages}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Avg. Keyword Difficulty
              </CardTitle>
              <Icons.Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {overview.avgKeywordDifficulty}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Est. Monthly Traffic
              </CardTitle>
              <Icons.Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {overview.totalTraffic.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="max-w-sm flex-1">
            <div className="relative">
              <Icons.Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                }}
                placeholder="Search content..."
                value={searchQuery}
              />
            </div>
          </div>
          <Select
            onValueChange={(value: typeof campaignTypeFilter) =>
              setCampaignTypeFilter(value)
            }
            value={campaignTypeFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="new-content">New Content</SelectItem>
              <SelectItem value="improvement">Improvement</SelectItem>
              <SelectItem value="do-nothing">Do Nothing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <GridListToggle onChange={setViewMode} value={viewMode} />
      </div>

      <LoadingError
        error={error || errorActiveProject}
        errorDescription="Something went wrong while loading campaigns. Please try again."
        errorTitle="Error loading campaigns"
        isLoading={isLoading || isLoadingActiveProject}
        loadingComponent={<CampaignSkeletons viewMode={viewMode} />}
        onRetry={refetch}
      />

      {!isLoading && !error && filteredCampaigns.length === 0 && (
        <EmptyState
          projectId={activeProject?.id ?? ""}
          searchQuery={searchQuery}
        />
      )}

      {!isLoading && !error && filteredCampaigns.length > 0 && (
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

      {!error && !isLoading && hasNextPage && (
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

type Campaign = RouterOutputs["content"]["list"]["data"][0];
function CampaignCard({
  campaign,
  viewMode,
}: {
  campaign: Campaign;
  viewMode: "grid" | "list";
}) {
  const { organizationSlug, projectSlug } = Route.useParams();
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  const getCampaignTypeBadge = (type: Campaign["campaignType"]) => {
    const variants = {
      "new-content": "default" as const,
      improvement: "secondary" as const,
      "do-nothing": "outline" as const,
    };
    const labels = {
      "new-content": "New",
      improvement: "Improve",
      "do-nothing": "Monitor",
    };
    return <Badge variant={variants[type]}>{labels[type]}</Badge>;
  };

  const getContentCategoryBadge = (category: Campaign["contentCategory"]) => {
    const labels = {
      "money-page": "Money Page",
      "authority-builder": "Authority",
      "quick-win": "Quick Win",
    };
    return <Badge variant="outline">{labels[category]}</Badge>;
  };

  const getStatusBadge = (status: Campaign["status"]) => {
    const variants: Record<
      Campaign["status"],
      "default" | "secondary" | "outline" | "destructive"
    > = {
      analyzing: "secondary",
      new: "outline",
      ready: "default",
      "generating-content": "secondary",
      "content-ready": "default",
      published: "default",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (viewMode === "list") {
    return (
      <Card className="relative transition-all duration-200 hover:bg-muted/50 hover:shadow-md">
        <Link
          className="absolute inset-0 z-10"
          params={{ organizationSlug, projectSlug, contentId: campaign.id }}
          to="/$organizationSlug/$projectSlug/articles/$contentId"
        >
          <span className="sr-only">View {campaign.pathname} campaign</span>
        </Link>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-muted">
                  <Icons.FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="truncate font-semibold text-lg">
                  {campaign.pathname}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getCampaignTypeBadge(campaign.campaignType)}
                  {getContentCategoryBadge(campaign.contentCategory)}
                  {getStatusBadge(campaign.status)}
                  {campaign.proposedFormat && (
                    <Badge variant="outline">{campaign.proposedFormat}</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 text-right text-muted-foreground text-sm">
              <p>Updated {formatDate(campaign.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative transition-all duration-200 hover:bg-muted/50 hover:shadow-md">
      <Link
        className="absolute inset-0 z-10"
        params={{ organizationSlug, projectSlug, contentId: campaign.id }}
        to="/$organizationSlug/$projectSlug/articles/$contentId"
      >
        <span className="sr-only">View {campaign.pathname} campaign</span>
      </Link>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm bg-muted">
            <Icons.FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 space-y-2">
            <CardTitle className="truncate font-semibold text-lg">
              {campaign.markdownVersions?.[0]?.title ?? campaign.pathname}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {getCampaignTypeBadge(campaign.campaignType)}
              {getContentCategoryBadge(campaign.contentCategory)}
              {getStatusBadge(campaign.status)}
              {campaign.proposedFormat && (
                <Badge variant="outline">{campaign.proposedFormat}</Badge>
              )}
            </div>
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

function EmptyState({
  searchQuery,
  projectId,
}: {
  searchQuery: string;
  projectId: string;
}) {
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
      {!searchQuery && <NewCampaignButton projectId={projectId} />}
    </div>
  );
}
function NewCampaignButton({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const { organizationSlug, projectSlug } = Route.useParams();
  const { mutate: createTask, isPending: isCreatingTask } = useMutation(
    getApiClientRq().task.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: getApiClientRq().project.get.queryKey({
            input: {
              organizationIdentifier: organizationSlug,
              identifier: projectSlug,
            },
          }),
        });
      },
    }),
  );

  return (
    <Button
      isLoading={isCreatingTask}
      onClick={() =>
        createTask({
          projectId,
          type: "analyze-keywords",
        })
      }
    >
      <Icons.Plus className="mr-2 h-4 w-4" />
      New Campaign
    </Button>
  );
}
