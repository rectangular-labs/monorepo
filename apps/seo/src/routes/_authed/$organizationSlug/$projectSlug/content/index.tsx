import type {
  RouterInputs,
  RouterOutputs,
} from "@rectangular-labs/api-seo/types";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rectangular-labs/ui/components/ui/dropdown-menu";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rectangular-labs/ui/components/ui/select";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { OverviewCards } from "~/routes/_authed/$organizationSlug/$projectSlug/-components/overview-cards";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/",
)({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      getApiClientRq().project.get.queryOptions({
        input: {
          organizationIdentifier: params.organizationSlug,
          identifier: params.projectSlug,
        },
      }),
    );

    return null;
  },
  component: PageComponent,
});

function PageComponent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | RouterInputs["campaigns"]["list"]["status"]
  >("all");
  const { organizationSlug, projectSlug } = Route.useParams();
  const {
    data: activeProject,
    isLoading: isLoadingProject,
    error: projectError,
  } = useQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
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
    getApiClientRq().campaigns.list.infiniteOptions({
      input: (pageParam) => ({
        organizationId: activeProject?.organizationId ?? "",
        projectId: activeProject?.id ?? "",
        limit: 10,
        cursor: pageParam,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextPageCursor ?? undefined,
      enabled: !!activeProject?.id && !isLoadingProject && !projectError,
    }),
  );

  const allCampaigns: Campaign[] = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  const filtered = allCampaigns.filter((c) =>
    (c.id ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage and monitor your content sessions
          </p>
        </div>
      </div>

      <OverviewCards projectId={activeProject?.id ?? ""} />

      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="max-w-sm flex-1">
            <div className="relative">
              <Icons.Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns..."
                value={searchQuery}
              />
            </div>
          </div>
          <Select
            onValueChange={(v) =>
              setStatusFilter(v as RouterInputs["campaigns"]["list"]["status"])
            }
            value={statusFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="review-requested">Review Requested</SelectItem>
              <SelectItem value="review-approved">Review Approved</SelectItem>
              <SelectItem value="review-denied">Review Denied</SelectItem>
              <SelectItem value="review-change-requested">
                Review Change Requested
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <NewCampaignButton
          organizationId={activeProject?.organizationId ?? ""}
          projectId={activeProject?.id ?? ""}
        />
      </div>

      <LoadingError
        error={error || projectError}
        errorDescription="Something went wrong while loading campaigns. Please try again."
        errorTitle="Error loading campaigns"
        isLoading={isLoading || isLoadingProject}
        loadingComponent={<CampaignSkeletons />}
        onRetry={refetch}
      />

      {!isLoading && !error && filtered.length === 0 && <EmptyState />}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((campaign) => (
            <CampaignRow campaign={campaign} key={campaign.id} />
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

type Campaign = RouterOutputs["campaigns"]["list"]["data"][0];
function StatusBadge({ status }: { status: Campaign["status"] }) {
  const variants: Record<
    Campaign["status"],
    "default" | "secondary" | "outline" | "destructive"
  > = {
    draft: "outline",
    "review-requested": "secondary",
    "review-approved": "default",
    "review-denied": "destructive",
    "review-change-requested": "secondary",
  };
  const labels: Record<Campaign["status"], string> = {
    draft: "Draft",
    "review-requested": "Review Requested",
    "review-approved": "Approved",
    "review-denied": "Denied",
    "review-change-requested": "Change Requested",
  };
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const { organizationSlug, projectSlug } = Route.useParams();
  const updated = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(campaign.updatedAt));
  const hrefParams = {
    organizationSlug,
    projectSlug,
    campaignId: campaign.id,
  } as const;

  return (
    <Card className="relative transition-all duration-200 hover:bg-muted/50 hover:shadow-md">
      <Link
        className="absolute inset-0"
        params={hrefParams}
        to="/$organizationSlug/$projectSlug/campaign/$campaignId"
      >
        <span className="sr-only">Open campaign {campaign.title}</span>
      </Link>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate font-semibold text-lg">
              {campaign.title}
            </CardTitle>
            <div className="mt-1 flex items-center gap-2 text-muted-foreground text-sm">
              <StatusBadge status={campaign.status} />
              <span>Created by you</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground text-sm">
            <span>Last Mod {updated}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Icons.MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    const sessionPath = `${window.location.origin}/${organizationSlug}/${projectSlug}/campaign/${campaign.id}`;
                    void navigator.clipboard.writeText(sessionPath);
                  }}
                >
                  Copy Session link
                </DropdownMenuItem>
                <DropdownMenuItem disabled>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignSkeletons() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
        (<Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm bg-muted" />
              <div className="h-6 w-32 rounded bg-muted" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
          </CardContent>
        </Card>)
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icons.Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mb-2 font-semibold text-lg">No campaigns found</h3>
      <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
        Try adjusting your search or status filter.
      </p>
    </div>
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
  const { mutate: createCampaign, isPending } = useMutation(
    getApiClientRq().campaigns.create.mutationOptions({
      onSuccess: (data) => {
        toast.success("Campaign created");
        void navigate({
          from: "/$organizationSlug/$projectSlug/campaign",
          to: "/$organizationSlug/$projectSlug/campaign/$campaignId",
          params: {
            campaignId: data.id,
          },
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );
  return (
    <Button
      isLoading={isPending}
      onClick={() =>
        createCampaign({
          organizationId: organizationId,
          projectId: projectId,
        })
      }
    >
      <Icons.Plus className="size-4" />
      New Campaign
    </Button>
  );
}
