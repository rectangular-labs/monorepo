import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_authed/$organizationSlug/$projectSlug/"!</div>;
}
