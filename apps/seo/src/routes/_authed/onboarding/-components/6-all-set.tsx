import { PartyPopper } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import { AUTO_ROUTE_ORG } from "~/lib/constants";

export function OnboardingAllSet({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  const searchParams = useSearch({ from: "/_authed/onboarding/" });
  const { data: project } = useQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        identifier: searchParams.projectId ?? "",
        organizationIdentifier: searchParams.organizationId ?? "",
      },
      enabled: !!searchParams.projectId && !!searchParams.organizationId,
    }),
  );
  const { slug, name } = project ?? { name: "dashboard", slug: "" };

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
              projectSlug: slug ?? "",
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
