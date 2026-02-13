import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { capitalize } from "@rectangular-labs/core/format/capitalize";
import { formatStrategyGoal } from "@rectangular-labs/core/format/strategy-goal";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
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
import { Link, useMatchRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { ManageStrategyDialog } from "./manage-strategy-dialog";

type StrategySummary = RouterOutputs["strategy"]["list"]["strategies"][number];

function formatNumber(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

function getLatestMetricValue(strategy: StrategySummary) {
  const aggregate = strategy.snapshots?.[0]?.aggregate;
  if (!aggregate) return null;
  switch (strategy.goal.metric) {
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
  organizationId,
  projectId,
  className,
}: {
  strategy: StrategySummary;
  organizationId?: string;
  projectId?: string;
  className?: string;
}) {
  const api = getApiClientRq();
  const queryClient = useQueryClient();
  const matcher = useMatchRoute();
  const slugParams = matcher({
    to: "/$organizationSlug/$projectSlug",
    fuzzy: true,
  });

  const phase = strategy.phases?.[0] ?? null;
  const isSuggestion = strategy.status === "suggestion";
  const [viewOpen, setViewOpen] = useState(false);
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
        setViewOpen(false);
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
    !isSuggestion && slugParams && strategy.id
      ? {
          to: "/$organizationSlug/$projectSlug/strategies/$strategyId",
          params: {
            organizationSlug: slugParams.organizationSlug,
            projectSlug: slugParams.projectSlug,
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
        setViewOpen(true);
      }}
    >
      {detailHref && (
        <Link className="absolute inset-0" {...detailHref}>
          <span className="sr-only">Open strategy details</span>
        </Link>
      )}
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant={isSuggestion ? "secondary" : "outline"}>
            {isSuggestion ? "Suggestion" : capitalize(strategy.status)}
          </Badge>
          {phase && (
            <Badge className="capitalize" variant="outline">
              {phase.type}
            </Badge>
          )}
        </div>
        <CardTitle className="line-clamp-2 leading-snug">
          {strategy.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-muted-foreground text-sm">
          Goal:{" "}
          <span className="text-foreground">
            {formatStrategyGoal(strategy.goal)}
          </span>
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
      </CardContent>

      {isSuggestion && (
        <>
          <ViewStrategyDialog
            dismissalError={dismissalError}
            dismissalOpen={dismissalOpen}
            dismissalReason={dismissalReason}
            isAdopting={isAdopting}
            isDismissing={isDismissing}
            isPending={isPending}
            onAdopt={() => handleStatusChange("active")}
            onDismissalOpenChange={handleDismissalOpenChange}
            onDismissalReasonChange={(value) => {
              setDismissalReason(value);
              if (dismissalError) setDismissalError(null);
            }}
            onModify={() => {
              setViewOpen(false);
              setModifyOpen(true);
            }}
            onOpenChange={setViewOpen}
            onSubmitDismissal={submitDismissal}
            open={viewOpen}
            organizationId={organizationId}
            projectId={projectId}
            strategy={strategy}
          />
          <ManageStrategyDialog
            onOpenChange={setModifyOpen}
            open={modifyOpen}
            organizationId={organizationId ?? ""}
            projectId={projectId ?? ""}
            strategy={strategy}
          />
        </>
      )}
    </Card>
  );
}

function ViewStrategyDialog({
  strategy,
  open,
  onOpenChange,
  organizationId,
  projectId,
  isAdopting,
  isDismissing,
  isPending,
  onAdopt,
  onModify,
  dismissalOpen,
  onDismissalOpenChange,
  dismissalReason,
  onDismissalReasonChange,
  dismissalError,
  onSubmitDismissal,
}: {
  strategy: StrategySummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  projectId?: string;
  isAdopting: boolean;
  isDismissing: boolean;
  isPending: boolean;
  onAdopt: () => void;
  onModify: () => void;
  dismissalOpen: boolean;
  onDismissalOpenChange: (open: boolean) => void;
  dismissalReason: string;
  onDismissalReasonChange: (value: string) => void;
  dismissalError: string | null;
  onSubmitDismissal: () => void;
}) {
  return (
    <DialogDrawer
      className="sm:max-w-2xl"
      onOpenChange={onOpenChange}
      open={open}
    >
      <DialogDrawerHeader>
        <Badge className="w-fit" variant="secondary">
          Suggestion
        </Badge>
        <DialogDrawerTitle className="leading-snug">
          {strategy.name}
        </DialogDrawerTitle>
        <DialogDrawerDescription className="sr-only">
          Strategy suggestion details
        </DialogDrawerDescription>
      </DialogDrawerHeader>

      <div className="max-h-[70vh] space-y-4 overflow-y-auto">
        <div className="text-muted-foreground text-sm">
          Goal:{" "}
          <span className="font-medium text-foreground">
            {formatStrategyGoal(strategy.goal)}
          </span>
        </div>

        {strategy.motivation && (
          <div className="space-y-1">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Motivation
            </p>
            <p className="whitespace-pre-line text-sm">{strategy.motivation}</p>
          </div>
        )}

        {strategy.description && (
          <div className="space-y-1">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Description
            </p>
            <p className="whitespace-pre-wrap text-sm">
              {strategy.description}
            </p>
          </div>
        )}

        {strategy.phases && strategy.phases.length > 0 && (
          <div className="space-y-1">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Phases
            </p>
            <ul className="space-y-1">
              {strategy.phases.map((phase) => (
                <li className="text-sm" key={phase.id}>
                  <span className="text-muted-foreground capitalize">
                    {phase.type}
                  </span>{" "}
                  &mdash; {phase.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <DialogDrawerFooter className="gap-2">
        <DialogDrawer
          isLoading={isDismissing}
          onOpenChange={onDismissalOpenChange}
          open={dismissalOpen}
          trigger={
            <Button
              disabled={isAdopting || !organizationId || !projectId}
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
              onSubmitDismissal();
            }}
          >
            <Field data-invalid={!!dismissalError}>
              <FieldLabel htmlFor={`dismissal-reason-${strategy.id}`}>
                Dismissal reason
              </FieldLabel>
              <Textarea
                id={`dismissal-reason-${strategy.id}`}
                onChange={(event) =>
                  onDismissalReasonChange(event.currentTarget.value)
                }
                placeholder="Share why this strategy does not work for your project."
                rows={4}
                value={dismissalReason}
              />
              {dismissalError && <FieldError>{dismissalError}</FieldError>}
            </Field>
          </form>
          <DialogDrawerFooter className="gap-2">
            <Button
              onClick={() => onDismissalOpenChange(false)}
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
          <Button onClick={onModify} size="sm" type="button" variant="outline">
            Modify
          </Button>
          <Button
            disabled={isPending || !organizationId || !projectId}
            isLoading={isAdopting}
            onClick={onAdopt}
            size="sm"
            type="button"
          >
            Adopt Strategy
          </Button>
        </div>
      </DialogDrawerFooter>
    </DialogDrawer>
  );
}
