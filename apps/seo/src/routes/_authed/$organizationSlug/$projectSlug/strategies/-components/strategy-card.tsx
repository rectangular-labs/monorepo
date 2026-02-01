import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import {
  DialogDrawer,
  DialogDrawerDescription,
  DialogDrawerFooter,
  DialogDrawerHeader,
  DialogDrawerTitle,
} from "@rectangular-labs/ui/components/ui/dialog-drawer";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@rectangular-labs/ui/components/ui/field";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { StrategyModifyDialog } from "./strategy-modify-dialog";

type StrategySummary = RouterOutputs["strategy"]["list"]["strategies"][number];

function formatGoal(goal: StrategySummary["goal"]) {
  const metricLabel =
    goal.metric === "avgPosition" ? "avg position" : goal.metric;
  const timeframeLabel = goal.timeframe === "monthly" ? "per month" : "total";
  return `${goal.target} ${metricLabel} ${timeframeLabel}`;
}

function formatStatus(status: StrategySummary["status"]) {
  switch (status) {
    case "active":
      return "Active";
    case "observing":
      return "Observing";
    case "stable":
      return "Stable";
    case "archived":
      return "Archived";
    case "dismissed":
      return "Dismissed";
    case "suggestion":
      return "Suggestion";
    default: {
      const invalidStatus: never = status;
      throw new Error(`Invalid status received: ${invalidStatus}`);
    }
  }
}

const STATUS_SUMMARIES: Partial<Record<StrategySummary["status"], string>> = {
  active: "In progress and tracking outcomes.",
  observing: "Waiting for data to mature.",
  stable: "Goal met. No new phase recommended.",
};

function formatNumber(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

function getLatestMetricValue(strategy: StrategySummary) {
  const aggregate = strategy.latestSnapshot?.aggregate;
  if (!aggregate) return null;
  switch (strategy.goal.metric) {
    case "conversions":
      return aggregate.conversions ?? null;
    case "clicks":
      return aggregate.clicks;
    case "impressions":
      return aggregate.impressions;
    case "avgPosition":
      return aggregate.avgPosition;
    default:
      return null;
  }
}

function getProgressPercent(strategy: StrategySummary, current: number | null) {
  if (current === null || current === undefined) return null;
  const target = strategy.goal.target;
  if (!Number.isFinite(target) || target <= 0) return null;

  if (strategy.goal.metric === "avgPosition") {
    if (current <= 0) return null;
    if (current <= target) return 100;
    return Math.max(0, Math.min(100, Math.round((target / current) * 100)));
  }

  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

export function StrategyCard({
  strategy,
  organizationSlug,
  projectSlug,
  organizationId,
  projectId,
  className,
}: {
  strategy: StrategySummary;
  organizationSlug?: string;
  projectSlug?: string;
  organizationId?: string;
  projectId?: string;
  className?: string;
}) {
  const api = getApiClientRq();
  const queryClient = useQueryClient();

  const phase = strategy.phases?.[0] ?? null;
  const statusSummary = STATUS_SUMMARIES[strategy.status];
  const isSuggestion = strategy.status === "suggestion";
  const [modifyOpen, setModifyOpen] = useState(false);

  const [pendingAction, setPendingAction] = useState<
    "adopt" | "dismiss" | null
  >(null);
  const [dismissalOpen, setDismissalOpen] = useState(false);
  const [dismissalReason, setDismissalReason] = useState("");
  const [dismissalError, setDismissalError] = useState<string | null>(null);

  const handleDismissalOpenChange = (open: boolean) => {
    setDismissalOpen(open);
    if (!open) {
      setDismissalReason("");
      setDismissalError(null);
    }
  };

  const { mutate: updateStrategy, isPending } = useMutation(
    api.strategy.update.mutationOptions({
      onError: (error) => {
        setPendingAction(null);
        toast.error(error.message);
      },
      onSuccess: async (data) => {
        setPendingAction(null);
        toast.success(
          `Successfully ${data.status === "active" ? "adopted" : "dismissed"} strategy "${data.name}"`,
        );
        if (data.status === "dismissed") {
          setDismissalOpen(false);
          setDismissalReason("");
          setDismissalError(null);
        }
        if (organizationId) {
          await queryClient.invalidateQueries({
            queryKey: api.strategy.list.queryKey({
              input: {
                organizationIdentifier: organizationId,
                projectId: data.projectId,
              },
            }),
          });
        }
      },
    }),
  );

  const handleStatusChange = (
    status: "active" | "dismissed",
    reason?: string,
  ) => {
    if (
      isPending ||
      !organizationId ||
      !projectId ||
      !isSuggestion ||
      !strategy.id
    ) {
      return;
    }
    setPendingAction(status === "active" ? "adopt" : "dismiss");
    updateStrategy({
      id: strategy.id,
      projectId,
      organizationIdentifier: organizationId,
      status,
      ...(status === "dismissed"
        ? { dismissalReason: reason }
        : { dismissalReason: null }),
    });
  };

  const submitDismissal = () => {
    if (isPending) return;
    const trimmedReason = dismissalReason.trim();
    if (!trimmedReason) {
      setDismissalError("Please share a reason for dismissing this strategy.");
      return;
    }
    setDismissalError(null);
    handleStatusChange("dismissed", trimmedReason);
  };

  const isAdopting = isPending && pendingAction === "adopt";
  const isDismissing = isPending && pendingAction === "dismiss";
  const latestValue = getLatestMetricValue(strategy);
  const progressPercent = getProgressPercent(strategy, latestValue);
  const hasProgress =
    typeof progressPercent === "number" &&
    !Number.isNaN(progressPercent) &&
    strategy.status !== "suggestion";
  const formattedLatest = formatNumber(
    latestValue,
    strategy.goal.metric === "avgPosition" ? 1 : 0,
  );
  const formattedTarget = formatNumber(strategy.goal.target, 0);

  const detailHref =
    !isSuggestion && organizationSlug && projectSlug && strategy.id
      ? {
          to: "/$organizationSlug/$projectSlug/strategies/$strategyId",
          params: {
            organizationSlug,
            projectSlug,
            strategyId: strategy.id,
          },
        }
      : null;

  return (
    <Card
      className={cn(
        "relative border-muted/60",
        isPending && isSuggestion ? "opacity-70" : "",
        isSuggestion ? "cursor-pointer transition hover:border-muted" : "",
        className,
      )}
      onClick={(event) => {
        if (!isSuggestion || event.defaultPrevented) return;
        setModifyOpen(true);
      }}
    >
      {detailHref && (
        <Link className="absolute inset-0" {...detailHref}>
          <span className="sr-only">Open strategy details</span>
        </Link>
      )}
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant={isSuggestion ? "secondary" : "outline"}>
            {isSuggestion ? "Suggestion" : formatStatus(strategy.status)}
          </Badge>
          {phase && (
            <Badge className="capitalize" variant="outline">
              {phase.type}
            </Badge>
          )}
        </div>
        <CardTitle className="line-clamp-2">{strategy.name}</CardTitle>
        {strategy.motivation && (
          <CardDescription className="line-clamp-3" title={strategy.motivation}>
            {strategy.motivation}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-muted-foreground text-sm">
          Goal:{" "}
          <span className="text-foreground">{formatGoal(strategy.goal)}</span>
        </div>
        {!isSuggestion && (
          <div className="space-y-2">
            {formattedLatest ? (
              <div className="text-muted-foreground text-sm">
                Current:{" "}
                <span className="text-foreground">
                  {strategy.goal.metric === "avgPosition"
                    ? `#${formattedLatest}`
                    : formattedLatest}
                </span>{" "}
                {formattedTarget ? (
                  <span className="text-muted-foreground">
                    (Target {strategy.goal.metric === "avgPosition" ? "#" : ""}
                    {formattedTarget})
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                No snapshots yet.
              </div>
            )}
            {hasProgress && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs">
                  <span>Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        {phase && (
          <div className="text-muted-foreground text-sm">
            Phase: <span className="text-foreground">{phase.name}</span>
          </div>
        )}
        {statusSummary && (
          <div className="text-muted-foreground text-sm">{statusSummary}</div>
        )}
      </CardContent>
      {isSuggestion && (
        <CardFooter>
          <DialogDrawer
            isLoading={isDismissing}
            onOpenChange={handleDismissalOpenChange}
            open={dismissalOpen}
            trigger={
              <Button
                disabled={isAdopting || !organizationId || !projectId}
                onClick={(event) => event.stopPropagation()}
                size="sm"
                type="button"
                variant="ghost"
              >
                Dismiss
              </Button>
            }
          >
            <DialogDrawerHeader>
              <DialogDrawerTitle>Dismiss strategy</DialogDrawerTitle>
              <DialogDrawerDescription>
                Tell us why this strategy is not a fit so we can improve future
                suggestions.
              </DialogDrawerDescription>
            </DialogDrawerHeader>

            <form
              className="grid max-h-[70vh] gap-6 overflow-y-auto"
              id="dismissal-form"
              onSubmit={(event) => {
                event.preventDefault();
                submitDismissal();
              }}
            >
              <Field data-invalid={!!dismissalError}>
                <FieldLabel htmlFor={`dismissal-reason-${strategy.id}`}>
                  Dismissal reason
                </FieldLabel>
                <Textarea
                  id={`dismissal-reason-${strategy.id}`}
                  onChange={(event) => {
                    setDismissalReason(event.currentTarget.value);
                    if (dismissalError) setDismissalError(null);
                  }}
                  placeholder="Share why this strategy does not work for your project."
                  rows={4}
                  value={dismissalReason}
                />
                {dismissalError && <FieldError>{dismissalError}</FieldError>}
              </Field>
            </form>
            <DialogDrawerFooter className="gap-2">
              <Button
                onClick={() => handleDismissalOpenChange(false)}
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                disabled={isAdopting || !organizationId || !projectId}
                form="dismissal-form"
                isLoading={isDismissing}
                type="submit"
              >
                Dismiss strategy
              </Button>
            </DialogDrawerFooter>
          </DialogDrawer>
          <div className="ml-auto flex items-center gap-2">
            <StrategyModifyDialog
              organizationId={organizationId ?? ""}
              onOpenChange={setModifyOpen}
              open={modifyOpen}
              projectId={projectId ?? ""}
              strategy={strategy}
              trigger={
                <Button
                  onClick={(event) => event.stopPropagation()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Modify
                </Button>
              }
            />
            <Button
              isLoading={isAdopting}
              onClick={(event) => {
                event.stopPropagation();
                handleStatusChange("active");
              }}
              size="sm"
              type="button"
            >
              Adopt Strategy
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
