import { PartyPopper } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { useNavigate } from "@tanstack/react-router";

export function OnboardingAllSet({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  const navigate = useNavigate({ from: "/onboarding" });
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PartyPopper className="size-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => navigate({ to: "/dashboard" })}
          type="button"
        >
          Go to Dashboard
        </Button>
      </CardFooter>
    </Card>
  );
}
