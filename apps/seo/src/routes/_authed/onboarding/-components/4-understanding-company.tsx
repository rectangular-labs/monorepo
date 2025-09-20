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
import { apiClientRq } from "~/lib/api";
import { OnboardingSteps } from "../-lib/steps";

export function OnboardingUnderstandingCompany({
  description,
  title,
}: {
  title: string;
  description: string;
}) {
  const matcher = OnboardingSteps.useStepper();
  const { crawlId, websiteUrl } = matcher.getMetadata<{
    crawlId: string;
    websiteUrl: string;
  }>("website-info");
  const [currentCrawlId, setCurrentCrawlId] = useState(crawlId);
  const { data: status, error: getStatusError } = useQuery(
    apiClientRq.companyBackground.getUnderstandSiteStatus.queryOptions({
      refetchInterval: 5_000,
      input: {
        id: currentCrawlId,
      },
    }),
  );
  const { mutate: retry, isPending } = useMutation(
    apiClientRq.companyBackground.understandSite.mutationOptions({
      onSuccess: (data) => {
        setCurrentCrawlId(data.id);
        toast.success("Retrying understanding site");
      },
      onError: () => {
        toast.error("Failed to retry understanding site");
      },
    }),
  );
  const goNext = () => {
    if (!status?.websiteInfo) {
      toast.error("No website info found");
      return;
    }
    matcher.setMetadata("website-info", {
      websiteUrl,
      ...status?.websiteInfo,
    });
    matcher.next();
  };

  if (getStatusError) {
    return (
      <div>Something went wrong getting status. Trying again in 5 seconds.</div>
    );
  }

  const isCompleted = status?.status === "completed";
  const needsRetry =
    status?.status === "failed" || status?.status === "cancelled";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col justify-center space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-muted-foreground text-sm">
              {status?.statusMessage ?? "We are setting things up..."}
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
