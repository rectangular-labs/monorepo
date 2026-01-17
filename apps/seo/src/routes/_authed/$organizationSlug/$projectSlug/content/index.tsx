"use client";

import { Button } from "@rectangular-labs/ui/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/",
)({
  component: PageComponent,
});

function PageComponent() {
  const { organizationSlug, projectSlug } = Route.useParams();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b px-4 py-2 md:px-6">
        <h1 className="font-semibold text-lg">Content</h1>
      </div>

      <div className="flex-1 p-6">
        <div className="rounded-md border bg-background p-6">
          <h2 className="font-medium text-base">Overview</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            We are building a richer overview here. For now, head to the
            published or scheduled pages.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link
                params={{ organizationSlug, projectSlug }}
                to="/$organizationSlug/$projectSlug/content/published"
              >
                Published content
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link
                params={{ organizationSlug, projectSlug }}
                to="/$organizationSlug/$projectSlug/content/scheduled"
              >
                Scheduled content
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
