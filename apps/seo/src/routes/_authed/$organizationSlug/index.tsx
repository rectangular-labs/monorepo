import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/$organizationSlug/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_authed/$organizationSlug/"!</div>;
}
