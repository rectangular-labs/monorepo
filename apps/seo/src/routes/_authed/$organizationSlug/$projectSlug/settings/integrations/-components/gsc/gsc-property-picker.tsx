import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import {
  AlertIcon,
  Check,
  GoogleIcon,
  Info,
} from "@rectangular-labs/ui/components/icon";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@rectangular-labs/ui/components/ui/alert";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Card } from "@rectangular-labs/ui/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@rectangular-labs/ui/components/ui/empty";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import { useCallback, useEffect, useState } from "react";
import { linkGoogleAccountForGsc } from "~/lib/auth";
import { getUrlDomain } from "~/lib/url";
import { LoadingError } from "~/routes/_authed/-components/loading-error";

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

function PropertyLoadingSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Loading skeleton
        <div className="rounded-md border p-3" key={index}>
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

type GscProperty =
  RouterOutputs["integrations"]["gsc"]["listProperties"]["properties"][number];
type GscPropertiesResponse =
  RouterOutputs["integrations"]["gsc"]["listProperties"];
type IntegrationSummary =
  RouterOutputs["integrations"]["list"]["integrations"][number];
export function GscPropertyPicker({
  existingIntegration,
  propertiesData,
  isLoading,
  error,
  onRetry,
  property,
  setProperty,
  projectWebsiteUrl,
}: {
  existingIntegration?: IntegrationSummary;
  propertiesData?: GscPropertiesResponse;
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  property: GscProperty | null;
  setProperty: (property: GscProperty | null) => void;
  projectWebsiteUrl?: string | null;
}) {
  const [showPotentialMissingPropertyWarning, setShowWarning] = useState(false);

  const existingConfig =
    existingIntegration?.config &&
    existingIntegration.config.provider === "google-search-console"
      ? existingIntegration.config
      : null;

  const currentlyConnected = existingConfig?.domain ?? null;
  const properties = propertiesData?.properties ?? [];

  useEffect(() => {
    if (!properties.length) {
      setShowWarning(false);
      return;
    }

    if (property) {
      return;
    }

    if (currentlyConnected) {
      const connected = properties.find(
        (item) => item.domain === currentlyConnected,
      );
      if (connected) {
        setProperty(connected);
        return;
      }
    }

    if (!projectWebsiteUrl) {
      setShowWarning(false);
      return;
    }

    const websiteDomain = getUrlDomain(projectWebsiteUrl);
    const matched = properties.find((item) => {
      if (item.type === "URL_PREFIX") {
        const propertyDomain = getUrlDomain(item.domain);
        return propertyDomain === websiteDomain;
      }
      return item.domain === websiteDomain;
    });

    setProperty(matched ?? null);
    setShowWarning(!matched);
  }, [
    currentlyConnected,
    properties,
    projectWebsiteUrl,
    property,
    setProperty,
  ]);

  const handleLinkGoogle = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("provider", "google-search-console");
    void linkGoogleAccountForGsc({ callbackURL: url.toString() });
  }, []);

  if (isLoading || error) {
    return (
      <LoadingError
        error={error}
        errorTitle="Failed to load properties"
        isLoading={isLoading}
        loadingComponent={<PropertyLoadingSkeleton count={3} />}
        onRetry={onRetry}
      />
    );
  }

  if (propertiesData && !propertiesData.hasGoogleAccount) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GoogleIcon />
          </EmptyMedia>
          <EmptyTitle>Connect Your Google Account</EmptyTitle>
          <EmptyDescription>
            Link your Google account to access Search Console data and track
            your content&apos;s search performance.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={handleLinkGoogle}>
            <GoogleIcon className="mr-2 size-4" />
            Connect Google
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (propertiesData && !propertiesData.hasGscScopes) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GoogleIcon />
          </EmptyMedia>
          <EmptyTitle>Grant Search Console Access</EmptyTitle>
          <EmptyDescription>
            Your Google account is connected, but we need additional permissions
            to access Search Console data. Click below to grant access.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={handleLinkGoogle}>
            <GoogleIcon className="mr-2 size-4" />
            Grant Search Console Access
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      {showPotentialMissingPropertyWarning && (
        <Alert>
          <AlertIcon />
          <AlertTitle>Potential Misconfiguration</AlertTitle>
          <AlertDescription>
            <AddProperty websiteUrl={projectWebsiteUrl ?? undefined} />
          </AlertDescription>
        </Alert>
      )}

      {properties.length > 0 ? (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {properties.map((item) => {
            const isSelected = property?.domain === item.domain;
            const isCurrentlyConnected = currentlyConnected === item.domain;
            const isDisabled = item.permissionLevel === "needs-verification";

            return (
              <Card
                className={`cursor-pointer p-3 transition-colors ${
                  isDisabled
                    ? "cursor-not-allowed opacity-60"
                    : "hover:bg-accent/50"
                } ${
                  isSelected
                    ? "border-primary bg-accent/30 ring-1 ring-primary"
                    : isDisabled
                      ? ""
                      : "hover:border-primary"
                }`}
                key={item.domain}
                onClick={() => !isDisabled && setProperty(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-sm">{item.domain}</p>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-secondary px-2 py-0.5 text-muted-foreground text-xs">
                        {item.type === "DOMAIN" ? "Domain" : "URL Prefix"}
                      </span>
                      <span
                        className={`text-xs ${
                          item.permissionLevel === "read-only" ||
                          item.permissionLevel === "needs-verification"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {item.permissionLevel === "write" && "Full Access"}
                        {item.permissionLevel === "read-only" && "Read Only"}
                        {item.permissionLevel === "needs-verification" &&
                          "Needs Verification"}
                      </span>
                      {isCurrentlyConnected && (
                        <span className="text-primary text-xs">
                          • Connected
                        </span>
                      )}
                    </div>
                    {item.permissionLevel === "read-only" && (
                      <p className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Info className="size-3" /> Read-only access may limit
                        some features
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Check aria-hidden="true" className="size-4 text-primary" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2 py-6 text-center">
          <p className="text-muted-foreground">
            No Search Console properties found for your account.
          </p>
          <AddProperty websiteUrl={projectWebsiteUrl ?? undefined} />
        </div>
      )}
    </div>
  );
}
