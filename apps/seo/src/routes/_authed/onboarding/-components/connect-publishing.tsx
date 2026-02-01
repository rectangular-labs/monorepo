import {
  type IntegrationProvider,
  PUBLISH_DESTINATION_PROVIDERS,
} from "@rectangular-labs/core/schemas/integration-parsers";
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
import { useSearch } from "@tanstack/react-router";
import { useMemo } from "react";
import { getApiClientRq } from "~/lib/api";
import { IntegrationCardGrid } from "../../$organizationSlug/$projectSlug/settings/integrations/-components/integration-card-grid";
import {
  INTEGRATION_METADATA,
  type IntegrationMetadata,
} from "../../$organizationSlug/$projectSlug/settings/integrations/-components/integration-metadata";
import { OnboardingSteps } from "../-lib/steps";

export function OnboardingConnectPublishing({
  description,
  title,
}: {
  title: string;
  description: string;
}) {
  const stepper = OnboardingSteps.useStepper();
  const searchParams = useSearch({ from: "/_authed/onboarding/" });
  const api = getApiClientRq();

  const { data: project, isLoading: projectLoading } = useQuery(
    api.project.get.queryOptions({
      input: {
        identifier: searchParams.projectId ?? "",
        organizationIdentifier: searchParams.organizationId ?? "",
      },
      enabled: !!searchParams.projectId && !!searchParams.organizationId,
    }),
  );

  const { data: integrationsData, isLoading: integrationsLoading } = useQuery(
    api.integrations.list.queryOptions({
      input: {
        organizationIdentifier:
          project?.organizationId ?? searchParams.organizationId ?? "",
        projectId: project?.id ?? "",
      },
      enabled: !!project?.id,
    }),
  );

  const integrations = integrationsData?.integrations ?? [];
  const hasPublishingIntegrations =
    integrations.filter((integration) =>
      PUBLISH_DESTINATION_PROVIDERS.includes(
        integration.provider as (typeof PUBLISH_DESTINATION_PROVIDERS)[number],
      ),
    ).length > 0;
  const publishingProviders = useMemo(
    () =>
      Object.entries(INTEGRATION_METADATA).filter(
        ([, meta]) => meta.category === "publishing",
      ) as [IntegrationProvider, IntegrationMetadata][],
    [],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(projectLoading || integrationsLoading) && (
          <div className="text-muted-foreground text-sm">
            Loading publishing options...
          </div>
        )}

        {!projectLoading && !integrationsLoading && !project && (
          <div className="text-muted-foreground text-sm">
            Missing project details. Please go back and try again.
          </div>
        )}

        {!projectLoading && !integrationsLoading && project && (
          <IntegrationCardGrid
            hasIntegrations={hasPublishingIntegrations}
            integrations={integrations}
            onConnectionComplete={() => stepper.next()}
            organizationId={project.organizationId ?? ""}
            projectId={project.id}
            providers={publishingProviders}
          />
        )}
      </CardContent>
      <CardFooter className="flex w-full justify-between">
        <Button onClick={() => stepper.prev()} type="button" variant="ghost">
          Back
        </Button>
        <Button onClick={() => stepper.next()} type="button" variant="ghost">
          Skip for now
        </Button>
      </CardFooter>
    </Card>
  );
}
