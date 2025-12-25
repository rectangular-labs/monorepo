import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$organizationSlug/$projectSlug/beta/insights",
      params: {
        organizationSlug: params.organizationSlug,
        projectSlug: params.projectSlug,
      },
    });
  },
});
