import { ONBOARDING_STRATEGY_SUGGESTION_INSTRUCTIONS } from "@rectangular-labs/core/ai/onboarding-strategy-suggestion-instructions";
import { Spinner } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import { StrategyCard } from "../../$organizationSlug/$projectSlug/strategies/-components/strategy-card";
import { OnboardingSteps } from "../-lib/steps";

export function OnboardingStrategyInsights({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  const stepper = OnboardingSteps.useStepper();
  const searchParams = useSearch({ from: "/_authed/onboarding/" });
  const api = getApiClientRq();
  const queryClient = useQueryClient();

  const { data: project } = useQuery(
    api.project.get.queryOptions({
      input: {
        organizationIdentifier: searchParams.organizationId ?? "",
        identifier: searchParams.projectId ?? "",
      },
      refetchInterval: (context) => {
        const status = context.state.data?.strategySuggestionsWorkflowId;
        if (!status) {
          return 5_000;
        }
        return false;
      },
      enabled: !!searchParams.projectId && !!searchParams.organizationId,
    }),
  );

  const workflowId =
    project?.strategySuggestionsWorkflowId ??
    project?.projectResearchWorkflowId ??
    null;
  const {
    data: taskStatus,
    error: taskStatusError,
    isLoading: taskStatusLoading,
  } = useQuery(
    api.task.getStatus.queryOptions({
      input: { id: workflowId ?? "" },
      enabled: !!workflowId,
      refetchInterval: (context) => {
        const status = context.state.data?.status;
        if (
          status === "pending" ||
          status === "queued" ||
          status === "running"
        ) {
          return 8_000;
        }
        return false;
      },
    }),
  );

  const isWorkflowActive =
    !!workflowId &&
    (taskStatus?.status === "pending" ||
      taskStatus?.status === "queued" ||
      taskStatus?.status === "running" ||
      taskStatusLoading);
  const isWorkflowFailed =
    taskStatus?.status === "failed" ||
    taskStatus?.status === "cancelled" ||
    !!taskStatusError;

  const { mutate: retry, isPending: isRetrying } = useMutation(
    api.task.create.mutationOptions({
      onSuccess: async (data) => {
        await api.project.update.call({
          id: data.projectId,
          organizationIdentifier: data.organizationId,
          strategySuggestionsWorkflowId: data.taskId,
        });
        await queryClient.invalidateQueries({
          queryKey: api.project.get.queryKey({
            input: {
              organizationIdentifier: searchParams.organizationId ?? "",
              identifier: searchParams.projectId ?? "",
            },
          }),
        });
      },
    }),
  );

  const { data: strategiesData, isLoading: strategiesLoading } = useQuery(
    api.strategy.list.queryOptions({
      input: {
        organizationIdentifier: searchParams.organizationId ?? "",
        projectId: searchParams.projectId ?? "",
      },
      enabled:
        !!searchParams.projectId &&
        !!searchParams.organizationId &&
        !isWorkflowActive,
    }),
  );
  const suggestions = (strategiesData?.strategies ?? []).filter(
    (strategy) => strategy.status === "suggestion",
  );
  const nonSuggestions = (strategiesData?.strategies ?? []).filter(
    (strategy) => strategy.status !== "suggestion",
  );

  return (
    <Card className="rounded-none border-none bg-transparent sm:rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isWorkflowActive && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Spinner className="size-4 animate-spin" />
            Generating strategy insights. This might take a while. Feel free to
            come back to this in a bit...
          </div>
        )}
        {strategiesLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Spinner className="size-4 animate-spin" />
            Loading freshly found strategies...
          </div>
        )}

        {isWorkflowFailed && (
          <div className="rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
            We hit a snag generating strategy insights. Please try again.
            <div className="mt-3">
              <Button
                disabled={isRetrying}
                onClick={() =>
                  retry({
                    type: "seo-generate-strategy-suggestions",
                    projectId: searchParams.projectId ?? "",
                    instructions: ONBOARDING_STRATEGY_SUGGESTION_INSTRUCTIONS,
                  })
                }
                type="button"
                variant="secondary"
              >
                Retry generation
              </Button>
            </div>
          </div>
        )}

        {!strategiesLoading && !isWorkflowActive && suggestions.length > 0 && (
          <div className="space-y-4">
            {suggestions.map((strategy) => (
              <StrategyCard
                key={strategy.id}
                organizationId={searchParams.organizationId ?? ""}
                projectId={searchParams.projectId ?? ""}
                strategy={strategy}
              />
            ))}
          </div>
        )}

        {!strategiesLoading &&
          !isWorkflowActive &&
          nonSuggestions.length > 0 && (
            <div className="space-y-4">
              {nonSuggestions.map((strategy) => (
                <StrategyCard key={strategy.id} strategy={strategy} />
              ))}
            </div>
          )}

        {!strategiesLoading &&
          !isWorkflowActive &&
          suggestions.length === 0 &&
          nonSuggestions.length === 0 && (
            <div className="rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
              We couldn&apos;t find any strategy suggestions yet.
            </div>
          )}
      </CardContent>
      <CardFooter className="flex w-full justify-between">
        <Button onClick={() => stepper.prev()} type="button" variant="ghost">
          Back
        </Button>
        <Button
          disabled={isWorkflowActive}
          onClick={() => stepper.next()}
          type="button"
          variant="ghost"
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}
