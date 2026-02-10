"use client";

import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { ONBOARDING_STRATEGY_SUGGESTION_INSTRUCTIONS } from "@rectangular-labs/core/ai/onboarding-strategy-suggestion-instructions";
import { CircleSlash } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@rectangular-labs/ui/components/ui/empty";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { ManageStrategyDialog } from "./-components/manage-strategy-dialog";
import { StrategyCard } from "./-components/strategy-card";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/strategies/",
)({
  beforeLoad: ({ context }) => {
    if (!context.user?.email?.endsWith("fluidposts.com")) {
      throw notFound();
    }
  },
  component: PageComponent,
});

function PageComponent() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const api = getApiClientRq();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const { data: activeProject } = useSuspenseQuery(
    api.project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  const {
    data: strategiesData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    api.strategy.list.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        projectId: activeProject.id,
      },
      enabled: !!activeProject.id,
    }),
  );
  const strategies = strategiesData?.strategies ?? [];
  const { mutate: generateStrategySuggestion, isPending: isGenerating } =
    useMutation(
      api.task.create.mutationOptions({
        onError: (error) => {
          toast.error(error.message);
        },
        onSuccess: async (data) => {
          await api.project.update.call({
            id: data.projectId,
            organizationIdentifier: data.organizationId,
            strategySuggestionsWorkflowId: data.taskId,
          });
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: api.project.get.queryKey({
                input: {
                  organizationIdentifier: organizationSlug,
                  identifier: projectSlug,
                },
              }),
            }),
            queryClient.invalidateQueries({
              queryKey: api.strategy.list.queryKey({
                input: {
                  organizationIdentifier: organizationSlug,
                  projectId: activeProject.id,
                },
              }),
            }),
          ]);
          toast.success("Generating strategy suggestions");
        },
      }),
    );

  const sections: {
    title: string;
    statuses: RouterOutputs["strategy"]["list"]["strategies"][number]["status"][];
    description: string;
  }[] = [
    {
      title: "Suggestions",
      statuses: ["suggestion"],
      description: "Fresh ideas ready to adopt or refine.",
    },
    {
      title: "Active",
      statuses: ["active"],
      description: "Strategies currently executing.",
    },
    {
      title: "Observing",
      statuses: ["observing"],
      description: "Waiting on performance data to make decisions.",
    },
    {
      title: "Stable",
      statuses: ["stable"],
      description: "Goals achieved. Monitoring for regressions",
    },
    // {
    //   title: "Archived",
    //   statuses: ["archived"],
    //   description: "Historical strategies for reference.",
    // },
    // {
    //   title: "Dismissed",
    //   statuses: ["dismissed"],
    //   description: "Dismissed strategies and learnings.",
    // },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-bold text-3xl tracking-tight">Strategies</h1>
          <p className="text-muted-foreground">
            Track strategy performance, phases, and content outcomes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={!activeProject.id || !activeProject.organizationId}
            isLoading={isGenerating}
            onClick={() =>
              generateStrategySuggestion({
                type: "seo-generate-strategy-suggestions",
                projectId: activeProject.id,
                instructions: ONBOARDING_STRATEGY_SUGGESTION_INSTRUCTIONS,
              })
            }
            size="sm"
            type="button"
            variant="outline"
          >
            Find new strategies
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            New strategy
          </Button>
        </div>
        <ManageStrategyDialog
          onOpenChange={setCreateOpen}
          open={createOpen}
          organizationId={activeProject.organizationId}
          projectId={activeProject.id}
        />
      </div>

      <LoadingError
        error={error}
        errorDescription="There was an error loading strategies. Please try again."
        errorTitle="Error loading strategies"
        isLoading={isLoading}
        loadingComponent={<StrategiesSkeleton />}
        onRetry={() => refetch()}
      />

      {!isLoading && !error && strategies.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleSlash />
            </EmptyMedia>
            <EmptyTitle>No strategies yet</EmptyTitle>
            <EmptyDescription>
              Once strategy insights are generated, they will appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!isLoading && !error && strategies.length > 0 && (
        <div className="space-y-8">
          {sections.map((section) => {
            const sectionStrategies = strategies.filter((strategy) =>
              section.statuses.includes(strategy.status),
            );
            if (sectionStrategies.length === 0) return null;
            return (
              <section className="space-y-4" key={section.title}>
                <div>
                  <h2 className="font-semibold text-lg">{section.title}</h2>
                  <p className="text-muted-foreground text-sm">
                    {section.description}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {sectionStrategies.map((strategy) => (
                    <StrategyCard
                      key={strategy.id}
                      organizationId={activeProject.organizationId}
                      projectId={activeProject.id}
                      strategy={strategy}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

function StrategiesSkeleton() {
  return (
    <div className="space-y-8 py-1">
      {Array.from({ length: 3 }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: loading skeleton
        <div className="space-y-4" key={index}>
          <div className="space-y-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        </div>
      ))}
    </div>
  );
}
