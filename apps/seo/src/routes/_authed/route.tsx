import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ location, context }) => {
    const session = await context.queryClient.fetchQuery(
      getApiClientRq().auth.session.current.queryOptions({
        staleTime: 15 * 1000, // 15 seconds
      }),
    );
    if (!session) {
      throw redirect({
        to: "/login",
        search: {
          next: `${location.pathname}${location.searchStr}`,
        },
      });
    }
    return { ...session };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return <Outlet />;
}
