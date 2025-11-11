import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import {
  AlertIcon,
  GoogleIcon,
  Info,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { linkGoogleAccountForGsc } from "~/lib/auth";
import { getUrlDomain } from "~/lib/url";

export function GscConnectionCard({
  projectId,
  organizationId,
}: {
  projectId: string;
  organizationId: string;
}) {
  const api = getApiClientRq();
  const qc = useQueryClient();

  // Load project (for websiteUrl and to ensure valid identifiers)
  const { data: project } = useQuery(
    api.project.get.queryOptions({
      input: { identifier: projectId, organizationIdentifier: organizationId },
    }),
  );

  // Load account/scopes + available properties
  const {
    data: propertiesData,
    isLoading: isLoadingProps,
    error: propertiesError,
  } = useQuery(api.googleSearchConsole.listProperties.queryOptions({}));

  // Load connected property (if any)
  const {
    data: connected,
    isLoading: isLoadingConnected,
    error: connectedError,
  } = useQuery(
    api.googleSearchConsole.getConnectedPropertyForProject.queryOptions({
      input: { projectId, gscPropertyId: project?.gscPropertyId ?? null },
    }),
  );

  const [selectedProperty, setSelectedProperty] = useState<
    | RouterOutputs["googleSearchConsole"]["listProperties"]["properties"][0]
    | null
  >(null);

  const { mutateAsync: connectProperty, isPending: isConnecting } = useMutation(
    api.googleSearchConsole.connectToProject.mutationOptions({
      onSuccess: async () => {
        toast.success("Google Search Console connected successfully!");
        await qc.invalidateQueries();
      },
      onError: (error) => {
        toast.error(`Failed to connect: ${error.message}`);
      },
    }),
  );

  const { mutateAsync: disconnectProperty, isPending: isDisconnecting } =
    useMutation(
      api.googleSearchConsole.disconnectFromProject.mutationOptions({
        onSuccess: async () => {
          toast.success("Disconnected from Google Search Console");
          await qc.invalidateQueries();
        },
        onError: (error) => {
          toast.error(`Failed to disconnect: ${error.message}`);
        },
      }),
    );

  const autoSelectedProperty = useMemo(() => {
    // Prefer highest permission if multiple accounts have same domain
    const permissionRank = (p: "write" | "read-only" | "needs-verification") =>
      p === "write" ? 3 : p === "read-only" ? 2 : 1;
    if (!project?.websiteUrl || !propertiesData?.properties?.length) {
      return null;
    }
    const websiteDomain = getUrlDomain(project.websiteUrl);
    const candidates = propertiesData.properties.filter((property) => {
      if (property.type === "URL_PREFIX") {
        return getUrlDomain(property.domain) === websiteDomain;
      }
      return property.domain === websiteDomain;
    });
    if (candidates.length === 0) return null;
    // pick the highest permission
    return candidates.sort(
      (a, b) =>
        permissionRank(b.permissionLevel) - permissionRank(a.permissionLevel),
    )[0];
  }, [project?.websiteUrl, propertiesData?.properties]);

  // Initialize selection when appropriate
  if (
    !selectedProperty &&
    !connected?.property &&
    autoSelectedProperty &&
    !isLoadingProps &&
    !isLoadingConnected
  ) {
    setSelectedProperty(autoSelectedProperty);
  }

  const handleConnect = async () => {
    if (!selectedProperty) {
      toast.error("Select a property to connect");
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

  const handleDisconnect = async () => {
    await disconnectProperty({ projectId });
  };

  const handleLinkGoogle = async () => {
    const params = new URLSearchParams(window.location.search);
    const callbackURL = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    await linkGoogleAccountForGsc({ callbackURL });
  };

  // Loading / error states
  if (isLoadingProps || isLoadingConnected) {
    return (
      <Card className="md:min-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GoogleIcon className="size-4" />
            Google Search Console
          </CardTitle>
          <CardDescription>Checking your connection…</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading…</p>
        </CardContent>
      </Card>
    );
  }
  if (propertiesError || connectedError) {
    return (
      <Card className="md:min-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GoogleIcon className="size-4" />
            Google Search Console
          </CardTitle>
          <CardDescription>We couldn't load your GSC data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">
            {(propertiesError as Error)?.message ||
              (connectedError as Error)?.message ||
              "Unknown error"}
          </p>
        </CardContent>
      </Card>
    );
  }

  // 1) No Google account or missing scopes → connect account card
  if (!propertiesData?.hasGoogleAccount || !propertiesData?.hasGscScopes) {
    return (
      <Card className="md:min-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GoogleIcon className="size-4" />
            Connect Google Search Console
          </CardTitle>
          <CardDescription>
            Connect to get accurate clicks and impressions from Google.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc text-muted-foreground">
            <li>Most accurate clicks and impressions from Google</li>
            <li>Up to date data on your website’s performance</li>
            <li>Identify ranking pages to optimize</li>
          </ul>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleLinkGoogle} size="lg">
            <GoogleIcon className="size-4" />
            Connect
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // 3) Already connected → show connected row with disconnect
  if (connected?.property) {
    const property = connected.property;
    return (
      <Card className="md:min-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GoogleIcon className="size-4" />
            Google Search Console
          </CardTitle>
          <CardDescription>Connected property</CardDescription>
        </CardHeader>
        <CardContent>
          <Card
            aria-label="Connected Google Search Console property"
            className="p-4"
            role="region"
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
                    {property.permissionLevel === "write" && "Full Access"}
                    {property.permissionLevel === "read-only" && "Read Only"}
                    {property.permissionLevel === "needs-verification" &&
                      "Needs Verification"}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            disabled={isDisconnecting}
            isLoading={isDisconnecting}
            onClick={handleDisconnect}
            variant="destructive"
          >
            Disconnect
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // 2) Has account + scopes, no connected property → select property view
  const properties = propertiesData?.properties ?? [];
  const showPotentialMissingPropertyWarning =
    project?.websiteUrl &&
    !properties.some((p) => {
      if (p.type === "URL_PREFIX") {
        return getUrlDomain(p.domain) === getUrlDomain(project.websiteUrl);
      }
      return p.domain === getUrlDomain(project.websiteUrl);
    });

  return (
    <Card className="md:min-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GoogleIcon className="size-4" />
          Connect a property
        </CardTitle>
        <CardDescription>
          Select a Google Search Console property to connect.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {showPotentialMissingPropertyWarning && (
          <Alert>
            <AlertIcon />
            <AlertTitle>Potential Misconfiguration</AlertTitle>
            <AlertDescription>
              <AddProperty websiteUrl={project?.websiteUrl} />
            </AlertDescription>
          </Alert>
        )}
        {properties.length > 0 ? (
          properties.map((property) => {
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
                key={`${property.accountId}-${property.domain}`}
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
                        {property.permissionLevel === "write" && "Full Access"}
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
      <CardFooter className="flex justify-end">
        <Button
          disabled={!selectedProperty || isConnecting}
          isLoading={isConnecting}
          onClick={handleConnect}
        >
          Connect
        </Button>
      </CardFooter>
    </Card>
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
