import type { Organization } from "@rectangular-labs/auth";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { getUserOrganizations } from "~/lib/auth/client";
import { OnboardingContent } from "./-components/content";
import { OnboardingSteps } from "./-lib/steps";

export const Route = createFileRoute("/_authed/onboarding/")({
  validateSearch: type({
    type: "'new-user' | 'new-project' = 'new-user'",
  }),
  loader: async () => {
    const organizations = await getUserOrganizations();
    if (!organizations.ok) {
      throw new Error(organizations.error.message);
    }
    if (organizations.value.length === 0) {
      return { organizations: organizations.value };
    }

    return {
      organizations: organizations.value,
    };
  },
  component: OnboardingPage,
});

function getInitialStep(
  type: "new-user" | "new-project",
  organizations: Organization[],
) {
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
  const { organizations } = Route.useLoaderData();

  const initialStep = getInitialStep(type, organizations);

  return (
    <OnboardingSteps.Scoped initialStep={initialStep}>
      <OnboardingContent />
    </OnboardingSteps.Scoped>
  );
}
