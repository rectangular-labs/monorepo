import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import type { Organization } from "@rectangular-labs/auth";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { getApiClientRq } from "~/lib/api";
import { OnboardingContent } from "./-components/content";
import { type OnboardingStep, OnboardingSteps } from "./-lib/steps";
import { useMetadata } from "./-lib/use-metadata";

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
        api.googleSearchConsole.listProperties.queryOptions(),
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

    console.log("project", project);
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
  project: RouterOutputs["project"]["get"],
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
  const { data: websiteInfoMetadata, set: setWebsiteInfoMetadata } =
    useMetadata("website-info");
  const { data: reviewProjectMetadata, set: setReviewProjectMetadata } =
    useMetadata("review-project");

  const initialStep = getInitialStep(
    type,
    organizations,
    project,
    gscConnectionStatus,
  );
  if (initialStep === "website-info" && project && !websiteInfoMetadata) {
    // prefill the website info so that users don't have to re-enter the website URL
    setWebsiteInfoMetadata({
      websiteUrl: project.websiteUrl,
      taskId: "",
      projectId: project.id,
      organizationId: project.organizationId,
    });
  }

  if (initialStep.startsWith("connect-gsc") && !reviewProjectMetadata) {
    // so that we have the project ID and organization ID to navigate too on completion of the onboarding.
    setReviewProjectMetadata({
      projectId: project?.id,
      organizationId: project?.organizationId,
      name: project?.name ?? undefined,
      slug: project?.slug ?? undefined,
    });
  }

  return (
    <OnboardingSteps.Scoped initialStep={initialStep}>
      <OnboardingContent />
    </OnboardingSteps.Scoped>
  );
}
