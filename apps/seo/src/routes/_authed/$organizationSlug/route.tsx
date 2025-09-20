import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/$organizationSlug")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
