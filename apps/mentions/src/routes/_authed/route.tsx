import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentSession } from "~/lib/auth/client";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ location }) => {
    const session = await getCurrentSession();
    if (!session) {
      throw redirect({
        to: "/login",
        search: {
          next: `${location.pathname}${location.searchStr}`,
        },
      });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return <Outlet />;
}
