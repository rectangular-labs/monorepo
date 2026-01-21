import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/settings/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$organizationSlug/$projectSlug/settings/project",
      params: {
        organizationSlug: params.organizationSlug,
        projectSlug: params.projectSlug,
      },
    });
  },
});
