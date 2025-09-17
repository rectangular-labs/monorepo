import { createFileRoute } from "@tanstack/react-router";
import { getApiClient } from "~/lib/api";
import { getUserOrganizations } from "~/lib/auth/client";
import { OnboardingContent } from "./-components/content";
import { OnboardingSteps } from "./-lib/steps";

export const Route = createFileRoute("/_authed/onboarding/")({
  loader: async () => {
    const organizations = await getUserOrganizations();
    if (organizations.length === 0) {
      return { organizations: organizations, existingProjects: [] };
    }

    const existingProjects = await getApiClient().projects.list({ limit: 1 });
    return {
      organizations: organizations,
      existingProjects: existingProjects.data,
    };
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const { existingProjects, organizations } = Route.useLoaderData();

  return (
    <OnboardingSteps.Scoped
      initialStep={
        organizations.length === 0
          ? "welcome"
          : existingProjects.length === 0
            ? "review-project"
            : "all-set"
      }
    >
      <OnboardingContent />
    </OnboardingSteps.Scoped>
  );
}
