"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import {
  ContentDisplay,
  useContentDisplayController,
} from "../-components/content-display";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/$draftId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { organizationSlug, projectSlug, draftId } = Route.useParams();
  const api = getApiClientRq();

  const { data: activeProject } = useSuspenseQuery(
    api.project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  const controller = useContentDisplayController({
    draftId,
    organizationIdentifier: activeProject.organizationId,
    projectId: activeProject.id,
  });

  return (
    <Section className="w-full max-w-7xl space-y-4 py-4">
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link
            params={{ organizationSlug, projectSlug }}
            to="/$organizationSlug/$projectSlug/content"
          >
            <Icons.ArrowLeft className="size-4" />
            Back to content
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <ContentDisplay controller={controller} />
      </div>
    </Section>
  );
}
