import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import type { Organization } from "@rectangular-labs/auth";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { getApiClientRq } from "~/lib/api";
import { OnboardingContent } from "./-components/content";
import { type OnboardingStep, OnboardingSteps } from "./-lib/steps";

export const Route = createFileRoute("/_authed/onboarding/")({
  validateSearch: type({
    type: "'new-user' | 'new-project' = 'new-user'",
    "projectId?": "string.uuid",
    "organizationId?": "string",
  }),
  loaderDeps: ({ search }) => ({
    projectId: search.projectId,
    organizationId: search.organizationId,
  }),
  loader: async ({ context, deps }) => {
    const api = getApiClientRq();

    const organizations = await context.queryClient.fetchQuery(
      api.auth.organization.list.queryOptions(),
    );

    if (organizations.length === 0) {
      return {
        organizations: [],
        gscConnectionStatus: null,
        project: null,
      };
    }

    const [gscProperties, project] = await Promise.all([
      context.queryClient.fetchQuery(
        api.integrations.gsc.listProperties.queryOptions(),
      ),
      ...(deps.projectId && deps.organizationId
        ? [
            context.queryClient.fetchQuery(
              api.project.get.queryOptions({
                input: {
                  identifier: deps.projectId,
                  organizationIdentifier: deps.organizationId,
                },
              }),
            ),
          ]
        : [new Promise<null>((resolve) => resolve(null))]),
    ]);

    return {
      organizations,
      gscConnectionStatus: {
        hasGscScopes: gscProperties.hasGscScopes,
      },
      project: project ?? null,
    };
  },
  component: OnboardingPage,
});

function getInitialStep(
  type: "new-user" | "new-project",
  organizations: Organization[],
  project: RouterOutputs["project"]["get"] | null,
  gscConnectionStatus: {
    hasGscScopes: boolean;
  } | null,
): OnboardingStep {
  // project ID exists which means we already have a project
  if (project) {
    if (!project.name) {
      return "website-info";
    }
    if (gscConnectionStatus?.hasGscScopes) {
      return "connect-gsc-property";
    }
    return "connect-gsc";
  }

  switch (type) {
    case "new-user": {
      if (organizations.length === 0) {
        return "welcome";
      }
      return "website-info";
    }
    case "new-project": {
      return "website-info";
    }
    default: {
      const _never: never = type;
      throw new Error("Invalid type");
    }
  }
}

function OnboardingPage() {
  const { type } = Route.useSearch();
  const { organizations, gscConnectionStatus, project } = Route.useLoaderData();

  const initialStep = getInitialStep(
    type,
    organizations,
    project,
    gscConnectionStatus,
  );

  return (
    <OnboardingSteps.Scoped initialStep={initialStep}>
      <OnboardingContent />
    </OnboardingSteps.Scoped>
  );
}
