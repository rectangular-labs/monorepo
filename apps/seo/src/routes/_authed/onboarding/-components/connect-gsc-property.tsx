import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { GoogleIcon } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { GscPropertyPicker } from "../../$organizationSlug/$projectSlug/settings/integrations/-components/gsc/gsc-property-picker";
import { OnboardingSteps } from "../-lib/steps";

export function OnboardingConnectGscProperty({
  description,
  title,
}: {
  title: string;
  description: string;
}) {
  const stepper = OnboardingSteps.useStepper();

  const searchParams = useSearch({ from: "/_authed/onboarding/" });
  const api = getApiClientRq();

  const [selectedProperty, setSelectedProperty] = useState<
    | RouterOutputs["integrations"]["gsc"]["listProperties"]["properties"][0]
    | null
  >(null);
  const {
    data: propertiesData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    api.integrations.gsc.listProperties.queryOptions({
      input: {
        organizationIdentifier: searchParams.organizationId ?? "",
        projectId: searchParams.projectId ?? "",
      },
      enabled: !!searchParams.organizationId && !!searchParams.projectId,
    }),
  );
  const hasGscScopes = propertiesData?.hasGscScopes ?? false;
  const { data: projectData } = useQuery(
    api.project.get.queryOptions({
      input: {
        identifier: searchParams.projectId ?? "",
        organizationIdentifier: searchParams.organizationId ?? "",
      },
      enabled: !!searchParams.projectId && !!searchParams.organizationId,
    }),
  );

  const { data: integrationsData } = useQuery(
    api.integrations.list.queryOptions({
      input: {
        projectId: searchParams.projectId ?? "",
        organizationIdentifier: searchParams.organizationId ?? "",
      },
      enabled: !!searchParams.projectId && !!searchParams.organizationId,
    }),
  );

  const existingIntegration = integrationsData?.integrations.find(
    (integration) => integration.provider === "google-search-console",
  );
  const queryClient = useQueryClient();
  const { mutateAsync: createIntegration, isPending: isCreating } = useMutation(
    api.integrations.create.mutationOptions({
      onSuccess: async () => {
        toast.success("Google Search Console connected successfully!");
        await queryClient.invalidateQueries({
          queryKey: api.integrations.list.queryKey({
            input: {
              projectId: searchParams.projectId ?? "",
              organizationIdentifier: searchParams.organizationId ?? "",
            },
          }),
        });
        stepper.next();
      },
      onError: (error: Error) => {
        toast.error(`Failed to connect: ${error.message}`);
      },
    }),
  );
  const { mutateAsync: updateIntegration, isPending: isUpdating } = useMutation(
    api.integrations.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Google Search Console connected successfully!");
        await queryClient.invalidateQueries({
          queryKey: api.integrations.list.queryKey({
            input: {
              projectId: searchParams.projectId ?? "",
              organizationIdentifier: searchParams.organizationId ?? "",
            },
          }),
        });
        stepper.next();
      },
      onError: (error: Error) => {
        toast.error(`Failed to connect: ${error.message}`);
      },
    }),
  );

  const isPending = isCreating || isUpdating;

  const handleConnect = async () => {
    if (
      !selectedProperty ||
      !searchParams.projectId ||
      !searchParams.organizationId
    ) {
      toast.error("Missing project or property information");
      return;
    }

    const config = {
      provider: "google-search-console" as const,
      domain: selectedProperty.domain,
      propertyType: selectedProperty.type,
      permissionLevel: selectedProperty.permissionLevel,
    };

    if (existingIntegration) {
      await updateIntegration({
        id: existingIntegration.id,
        projectId: searchParams.projectId,
        organizationIdentifier: searchParams.organizationId,
        accountId: selectedProperty.accountId,
        name: selectedProperty.domain,
        config,
      });
    } else {
      await createIntegration({
        projectId: searchParams.projectId,
        organizationIdentifier: searchParams.organizationId,
        accountId: selectedProperty.accountId,
        name: selectedProperty.domain,
        config,
      });
    }
  };

  const handleSkip = () => {
    stepper.next();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GoogleIcon className="size-4" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <GscPropertyPicker
            error={error}
            existingIntegration={existingIntegration}
            isLoading={isLoading}
            onRetry={refetch}
            projectWebsiteUrl={projectData?.websiteUrl}
            propertiesData={propertiesData}
            property={selectedProperty}
            setProperty={setSelectedProperty}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={() => {
              if (hasGscScopes) {
                stepper.goTo("website-info");
              } else {
                stepper.prev();
              }
            }}
            variant="ghost"
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button disabled={isPending} onClick={handleSkip} variant="ghost">
              Skip for now
            </Button>
            <Button
              disabled={!selectedProperty}
              isLoading={isPending}
              onClick={handleConnect}
            >
              Connect
            </Button>
          </div>
        </CardFooter>
      </Card>

      <p className="text-center text-muted-foreground text-xs">
        You can manage your Google Search Console connection in project settings
        at any time.
      </p>
    </div>
  );
}
