import { Sparkles } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { OnboardingSteps } from "../-lib/steps";

export function OnboardingWelcome({
  description,
  title,
}: {
  title: string;
  description: string;
}) {
  const matcher = OnboardingSteps.useStepper();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full" onClick={() => matcher.next()} type="button">
          Get Started
        </Button>
      </CardFooter>
    </Card>
  );
}
