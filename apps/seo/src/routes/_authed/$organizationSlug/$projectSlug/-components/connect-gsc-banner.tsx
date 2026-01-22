"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@rectangular-labs/ui/components/ui/alert";
import { Link } from "@tanstack/react-router";

export function ConnectGscBanner() {
  return (
    <Alert variant="warning">
      <Icons.AlertTriangleIcon />
      <AlertTitle>Estimated Data</AlertTitle>
      <AlertDescription>
        <p>
          Data is estimated by combining search volume and estimated traffic
          from various data providers. These numbers are directional only.
        </p>
        <p>
          <Link
            className="underline"
            from="/$organizationSlug/$projectSlug"
            search={{ provider: "google-search-console" }}
            to="/$organizationSlug/$projectSlug/settings/integrations"
          >
            Connect
          </Link>{" "}
          your Google Search Console property to unlock up to date data.
        </p>
      </AlertDescription>
    </Alert>
  );
}
