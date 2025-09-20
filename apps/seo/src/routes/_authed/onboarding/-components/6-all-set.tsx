import { PartyPopper } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { Link } from "@tanstack/react-router";

export function OnboardingAllSet({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
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
        <Button asChild className="w-full" type="button">
          <Link to="/organization">Go to Dashboard</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
