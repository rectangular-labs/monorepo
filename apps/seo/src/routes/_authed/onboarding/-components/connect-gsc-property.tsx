import type {
  seoGscPermissionLevelSchema,
  seoGscPropertyTypeSchema,
} from "@rectangular-labs/db/parsers";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { OnboardingSteps } from "../-lib/steps";
import { useMetadata } from "../-lib/use-metadata";

type GscProperty = {
  accountId: string;
  domain: string;
  type: typeof seoGscPropertyTypeSchema.infer;
  permissionLevel: typeof seoGscPermissionLevelSchema.infer;
};

export function OnboardingConnectGscProperty({
  description,
  title,
}: {
  title: string;
  description: string;
}) {
  const stepper = OnboardingSteps.useStepper();
  const searchParams = useSearch({ from: "/_authed/onboarding/" });
  const { data: reviewProjectMetadata } = useMetadata("review-project");
  const api = getApiClientRq();
  const [selectedProperty, setSelectedProperty] = useState<GscProperty | null>(
    null,
  );

  const projectId = searchParams.projectId || reviewProjectMetadata?.projectId;

  // Fetch GSC properties
  const {
    data: propertiesData,
    isLoading,
    error,
  } = useQuery(api.googleSearchConsole.listProperties.queryOptions({}));

  // Connect property to project mutation
  const { mutateAsync: connectProperty, isPending } = useMutation(
    api.googleSearchConsole.connectToProject.mutationOptions({
      onSuccess: (data) => {
        stepper.setMetadata("connect-gsc-property", {
          gscPropertyId: data.gscPropertyId,
          projectId: data.projectId,
        });
        toast.success("Google Search Console connected successfully!");
        stepper.next();
      },
      onError: (error) => {
        toast.error(`Failed to connect: ${error.message}`);
      },
    }),
  );

  const handleConnect = async () => {
    if (!selectedProperty || !projectId) {
      toast.error("Missing project or property information");
      return;
    }

    await connectProperty({
      projectId,
      accountId: selectedProperty.accountId,
      domain: selectedProperty.domain,
      propertyType: selectedProperty.type,
      permissionLevel: selectedProperty.permissionLevel,
    });
  };

  const handleSkip = () => {
    stepper.next();
  };

  if (isLoading) {
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
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="size-8 animate-spin rounded-full border-primary border-b-2" />
                <p className="text-muted-foreground text-sm">
                  Loading properties...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
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
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-destructive">Failed to load GSC properties</p>
              <p className="mt-2 text-muted-foreground text-sm">
                {error.message}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={() => stepper.prev()} variant="ghost">
              Back
            </Button>
            <Button onClick={handleSkip} variant="ghost">
              Skip for now
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show property selection
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
          {propertiesData?.properties &&
          propertiesData.properties.length > 0 ? (
            propertiesData.properties.map((property) => {
              const isSelected = selectedProperty?.domain === property.domain;
              return (
                <Card
                  className={`cursor-pointer p-4 transition-colors hover:bg-accent/50 ${
                    isSelected
                      ? "border-primary bg-accent/30 ring-1 ring-primary"
                      : "hover:border-primary"
                  }`}
                  key={property.domain}
                  onClick={() => setSelectedProperty(property)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{property.domain}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded bg-secondary px-2 py-0.5 text-muted-foreground text-xs">
                          {property.type === "DOMAIN"
                            ? "Domain Property"
                            : "URL Prefix"}
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
                      {(property.permissionLevel === "read-only" ||
                        property.permissionLevel === "needs-verification") && (
                        <p className="mt-1 text-muted-foreground text-xs">
                          ⚠️{" "}
                          {property.permissionLevel === "read-only"
                            ? "Read-only access may limit some features"
                            : "Property needs verification"}
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
            <div className="py-6 text-center">
              <p className="text-muted-foreground">
                No Search Console properties found for your account.
              </p>
              <p className="mt-2 text-muted-foreground text-sm">
                Make sure your website is added to{" "}
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
              disabled={!selectedProperty || isPending}
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
