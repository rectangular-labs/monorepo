import type { Organization } from "@rectangular-labs/auth";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { getApiClientRq } from "~/lib/api";
import { OnboardingContent } from "./-components/content";
import { OnboardingSteps } from "./-lib/steps";

export const Route = createFileRoute("/_authed/onboarding/")({
  validateSearch: type({
    type: "'new-user' | 'new-project' = 'new-user'",
  }),
  loader: async ({ context }) => {
    const organizations = await context.queryClient.fetchQuery(
      getApiClientRq().auth.organization.list.queryOptions(),
    );

    if (organizations.length === 0) {
      return { organizations: [] };
    }

    return {
      organizations: organizations,
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
