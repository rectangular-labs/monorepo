import { createFileRoute, redirect } from "@tanstack/react-router";
import { apiClientRq } from "~/lib/api";
import { getUserOrganizations } from "~/lib/auth/client";

export const Route = createFileRoute("/_authed/dashboard")({
  component: ProjectPicker,
  beforeLoad: async ({ context }) => {
    const organizations = await getUserOrganizations();
    if (organizations.length === 0) {
      throw redirect({
        to: "/onboarding",
      });
    }
    // we need to check org first otherwise the following call will throw a 404
    const projects = await context.queryClient.fetchQuery(
      apiClientRq.projects.list.queryOptions({
        input: {
          limit: 1,
        },
      }),
    );
    if (projects.data.length === 0) {
      throw redirect({
        to: "/onboarding",
      });
    }
  },
});

function ProjectPicker() {
  return null;
}
