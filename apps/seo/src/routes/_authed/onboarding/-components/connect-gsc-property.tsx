import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import {
  AlertIcon,
  GoogleIcon,
  Info,
  Spinner,
} from "@rectangular-labs/ui/components/icon";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@rectangular-labs/ui/components/ui/alert";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { getUrlDomain } from "~/lib/url";
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
    | RouterOutputs["googleSearchConsole"]["listProperties"]["properties"][0]
    | null
  >(null);
  const [
    showPotentialMissingPropertyWarning,
    setShowPotentialMissingPropertyWarning,
  ] = useState(false);
  const {
    data: propertiesData,
    isLoading,
    error,
  } = useQuery(api.googleSearchConsole.listProperties.queryOptions({}));
  const { data: projectData } = useQuery(
    api.project.get.queryOptions({
      input: {
        identifier: searchParams.projectId ?? "",
        organizationIdentifier: searchParams.organizationId ?? "",
      },
      enabled: !!searchParams.projectId && !!searchParams.organizationId,
    }),
  );

  const { mutateAsync: connectProperty, isPending } = useMutation(
    api.googleSearchConsole.connectToProject.mutationOptions({
      onSuccess: () => {
        toast.success("Google Search Console connected successfully!");
        stepper.next();
      },
      onError: (error) => {
        toast.error(`Failed to connect: ${error.message}`);
      },
    }),
  );

  const handleConnect = async () => {
    if (!selectedProperty || !searchParams.projectId) {
      toast.error("Missing project or property information");
      return;
    }

    await connectProperty({
      projectId: searchParams.projectId,
      accountId: selectedProperty.accountId,
      domain: selectedProperty.domain,
      propertyType: selectedProperty.type,
      permissionLevel: selectedProperty.permissionLevel,
    });
  };

  const handleSkip = () => {
    stepper.next();
  };

  if (
    propertiesData?.properties &&
    propertiesData.properties.length > 0 &&
    !selectedProperty &&
    !showPotentialMissingPropertyWarning &&
    projectData?.websiteUrl
  ) {
    // properties and project data has loaded properly and we haven't selected a property yet, so let's try to find a matching property.
    const websiteDomain = getUrlDomain(projectData.websiteUrl);

    const matched = propertiesData.properties.find((property) => {
      if (property.type === "URL_PREFIX") {
        const propertyDomain = getUrlDomain(property.domain);
        return propertyDomain === websiteDomain;
      }
      return property.domain === websiteDomain;
    });
    setSelectedProperty(matched ?? null);
    setShowPotentialMissingPropertyWarning(!matched);
  }

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
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <Spinner className="size-8 animate-spin" />
                <p className="text-muted-foreground text-sm">
                  Loading properties...
                </p>
              </div>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-destructive">Failed to load GSC properties</p>
              <p className="mt-2 text-muted-foreground text-sm">
                {error.message}
              </p>
            </div>
          )}

          {showPotentialMissingPropertyWarning && (
            <Alert>
              <AlertIcon />
              <AlertTitle>Potential Misconfiguration</AlertTitle>
              <AlertDescription>
                <AddProperty websiteUrl={projectData?.websiteUrl} />
              </AlertDescription>
            </Alert>
          )}
          {propertiesData?.properties &&
          propertiesData.properties.length > 0 ? (
            propertiesData.properties.map((property) => {
              const isSelected = selectedProperty?.domain === property.domain;
              const isDisabled =
                property.permissionLevel === "needs-verification";

              return (
                <Card
                  className={`p-4 transition-colors ${
                    isDisabled
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:bg-accent/50"
                  } ${
                    isSelected
                      ? "border-primary bg-accent/30 ring-1 ring-primary"
                      : isDisabled
                        ? ""
                        : "hover:border-primary"
                  }`}
                  key={property.domain}
                  onClick={() => !isDisabled && setSelectedProperty(property)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <p className="font-medium">{property.domain}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded bg-secondary px-2 py-0.5 text-muted-foreground text-xs">
                          {property.type === "DOMAIN" ? "Domain" : "URL Prefix"}
                        </span>
                        <span
                          className={`flex items-center gap-1 text-xs ${
                            property.permissionLevel === "read-only" ||
                            property.permissionLevel === "needs-verification"
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {property.permissionLevel === "write" &&
                            "Full Access"}
                          {property.permissionLevel === "read-only" &&
                            "Read Only"}
                          {property.permissionLevel === "needs-verification" &&
                            "Needs Verification"}
                        </span>
                      </div>
                      {property.permissionLevel === "read-only" && (
                        <p className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Info className="size-3" /> Read-only access may limit
                          some features
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <svg
                        aria-label="Selected"
                        className="size-5 text-primary"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <title>Selected</title>
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="space-y-2 py-6 text-center">
              <p className="text-muted-foreground">
                No Search Console properties found for your account.
              </p>
              <AddProperty />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={() => stepper.prev()} variant="ghost">
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

function AddProperty({ websiteUrl }: { websiteUrl?: string }) {
  const websiteDomain = websiteUrl ? getUrlDomain(websiteUrl) : null;
  return (
    <p className="text-muted-foreground text-sm">
      Make sure your website {websiteDomain} is added to{" "}
      <a
        className="underline"
        href="https://search.google.com/search-console"
        rel="noopener noreferrer"
        target="_blank"
      >
        Google Search Console
      </a>
      .
    </p>
  );
}
