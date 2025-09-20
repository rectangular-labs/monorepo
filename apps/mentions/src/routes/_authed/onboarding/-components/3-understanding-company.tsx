import { Check, Spinner } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiClientRq } from "~/lib/api";
import { OnboardingSteps } from "../-lib/steps";

const steps = [
  {
    id: "background",
    label: "Understanding site background",
  },
  { id: "customer", label: "Constructing ideal customer profile" },
  { id: "tone", label: "Figuring out the best tone and response" },
] as const;
type StepIds = (typeof steps)[number]["id"];

export function OnboardingUnderstandingCompany({
  description,
  title,
}: {
  title: string;
  description: string;
}) {
  const matcher = OnboardingSteps.useStepper();
  const { crawlId } = matcher.getMetadata<{
    crawlId: string;
  }>("website-info");

  const { data: companyBackground, error: getStatusError } = useQuery(
    apiClientRq.companyBackground.getCrawlStatus.queryOptions({
      enabled: !!crawlId,
      input: {
        id: crawlId ?? "",
      },
      refetchInterval: 3_000, // every 3 seconds
    }),
  );

  if (getStatusError) {
    return (
      <div>Something went wrong getting status. Trying again in 5 seconds.</div>
    );
  }

  const status: Record<StepIds, "done" | "doing" | "pending"> = {
    background: companyBackground?.data?.description ? "done" : "doing",
    customer: companyBackground?.data?.idealCustomer
      ? "done"
      : companyBackground?.data?.description
        ? "doing"
        : "pending",
    tone: companyBackground?.data?.responseTone
      ? "done"
      : companyBackground?.data?.idealCustomer
        ? "doing"
        : "pending",
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col justify-center space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.map((step) => {
            return (
              <div className="flex items-center gap-2" key={step.id}>
                {status[step.id] === "pending" && (
                  <div
                    aria-hidden
                    className="m-2 size-2 rounded-full bg-muted-foreground"
                  />
                )}
                {status[step.id] === "doing" && (
                  <Spinner className="animate-spin" />
                )}
                {status[step.id] === "done" && (
                  <Check className="text-green-600" />
                )}
                <div>{step.label}</div>
              </div>
            );
          })}
        </CardContent>
        <CardFooter>
          <div className="flex w-full justify-between">
            <Button
              onClick={() => matcher.prev()}
              type="button"
              variant="ghost"
            >
              Back
            </Button>
            <Button
              className="w-full"
              disabled={status.tone !== "done"}
              onClick={matcher.next}
              type="button"
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
