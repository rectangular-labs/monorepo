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
import { AUTO_ROUTE_ORG } from "~/lib/constants";
import { useMetadata } from "../-lib/use-metadata";

export function OnboardingAllSet({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  const { data: reviewProjectMetadata } = useMetadata("review-project");
  const { slug = "", name = "" } = reviewProjectMetadata ?? {};

  return (
    <Card className="w-full rounded-none sm:rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PartyPopper className="size-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild className="w-full" type="button">
          <Link
            params={{
              organizationSlug: AUTO_ROUTE_ORG,
              projectSlug: slug,
            }}
            to="/$organizationSlug/$projectSlug"
          >
            Go to {name}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
