"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
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
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-semibold text-lg">Content</h1>
            <p className="text-muted-foreground text-sm">{projectSlug}</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link
              params={{ organizationSlug, projectSlug }}
              to="/$organizationSlug/$projectSlug/content/review/outlines"
            >
              Review drafts
              <Icons.ArrowRight aria-hidden="true" className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
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
