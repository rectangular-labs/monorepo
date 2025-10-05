import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { Progress } from "@rectangular-labs/ui/components/ui/progress";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { OnboardingSteps } from "../-lib/steps";
import { useMetadata } from "../-lib/use-metadata";

export function OnboardingUnderstandingSite({
  description,
  title,
}: {
  title: string;
  description: string;
}) {
  const matcher = OnboardingSteps.useStepper();
  const { data: websiteInfoMetadata } = useMetadata("website-info");
  const { data: understandingSiteMetadata, set: setUnderstandingSiteMetadata } =
    useMetadata("understanding-site");
  const autoWentNext = understandingSiteMetadata;

  const {
    taskId = "",
    projectId = "",
    websiteUrl = "",
    organizationId = "",
  } = websiteInfoMetadata ?? {};

  const [currentTaskId, setCurrentTaskId] = useState(taskId);
  const { data: status, error: getStatusError } = useQuery(
    getApiClientRq().task.getStatus.queryOptions({
      refetchInterval: 5_000,
      input: {
        id: currentTaskId,
      },
    }),
  );
  const { mutate: retry, isPending } = useMutation(
    getApiClientRq().task.create.mutationOptions({
      onSuccess: (data) => {
        setCurrentTaskId(data.taskId);
        toast.success("Retrying understanding site");
      },
      onError: () => {
        toast.error("Failed to retry understanding site");
      },
    }),
  );

  const goNext = () => {
    if (
      status?.output?.type !== "understand-site" ||
      !status?.output?.websiteInfo
    ) {
      toast.error("No website info found");
      return;
    }
    setUnderstandingSiteMetadata({
      websiteUrl,
      projectId,
      organizationId,
      ...status.output.websiteInfo,
    });
    matcher.next();
  };

  const isCompleted = status?.status === "completed";
  const needsRetry =
    status?.status === "failed" ||
    status?.status === "cancelled" ||
    getStatusError;

  if (
    isCompleted &&
    !autoWentNext &&
    status?.output?.type === "understand-site"
  ) {
    setUnderstandingSiteMetadata({
      websiteUrl,
      projectId,
      organizationId,
      ...status.output.websiteInfo,
    });
    matcher.next();
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col justify-center space-y-6">
      <Card className="rounded-none sm:rounded-lg">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-muted-foreground text-sm">
              {getStatusError?.message ??
                status?.statusMessage ??
                "We are setting things up..."}
            </div>
            <Progress value={status?.progress ?? 0} />
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full justify-between">
            <Button
              disabled={!isCompleted && !needsRetry}
              onClick={() => matcher.prev()}
              type="button"
              variant="ghost"
            >
              Back
            </Button>
            {!isCompleted && !needsRetry && (
              <Button disabled type="button">
                Processing...
              </Button>
            )}
            {isCompleted && (
              <Button onClick={goNext} type="button">
                Next
              </Button>
            )}
            {needsRetry && (
              <Button
                isLoading={isPending}
                onClick={() => {
                  retry({
                    websiteUrl,
                    type: "understand-site",
                    projectId,
                  });
                }}
                type="button"
              >
                Retry
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
