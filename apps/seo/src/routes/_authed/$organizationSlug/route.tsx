import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getApiClient, getApiClientRq } from "~/lib/api";
import { AUTO_ROUTE_ORG } from "~/lib/constants";
import { AppHeader } from "./-components/app-header";
import { ProjectChatProvider } from "./-components/project-chat-provider";

export const Route = createFileRoute("/_authed/$organizationSlug")({
  beforeLoad: async ({ params, context, preload }) => {
    const [organizations, activeOrganization] = await Promise.all([
      context.queryClient.fetchQuery(
        getApiClientRq().auth.organization.list.queryOptions(),
      ),
      context.queryClient.fetchQuery(
        getApiClientRq().auth.organization.active.queryOptions(),
      ),
    ]);

    // redirect users to onboarding if they are not in an organization
    const [organization] = organizations;
    if (!organization) {
      throw redirect({
        to: "/onboarding",
      });
    }

    // we are already on the active organization
    if (activeOrganization?.slug === params.organizationSlug) {
      return {
        activeOrganization,
        organizations,
      };
    }
    // auto route to current active org if org slug is 'organization'
    if (
      params.organizationSlug === AUTO_ROUTE_ORG &&
      activeOrganization?.slug
    ) {
      throw redirect({
        to: ".",
        params: (params) => ({
          ...params,
          organizationSlug: activeOrganization.slug,
        }),
      });
    }

    // when preloading, we don't need to set the active organization otherwise it will override the active organization that the user is already on
    if (preload) {
      return {
        organizations,
        activeOrganization: undefined,
      };
    }

    // Our current $organizationSlug is not the active organization, try to make the current organization the active organization
    const result = await getApiClient().auth.organization.setActive({
      organizationId: null,
      organizationSlug:
        params.organizationSlug === AUTO_ROUTE_ORG
          ? organization.slug
          : params.organizationSlug,
    });
    if (!result) {
      throw redirect({
        to: ".",
        params: (params) => ({
          ...params,
          organizationSlug: activeOrganization?.slug || AUTO_ROUTE_ORG,
        }),
      });
    }
    if (params.organizationSlug === AUTO_ROUTE_ORG) {
      throw redirect({
        to: ".",
        params: (params) => ({
          ...params,
          organizationSlug: result.slug,
        }),
      });
    }
    await context.queryClient.invalidateQueries({
      queryKey: getApiClientRq().auth.organization.active.queryKey(),
      refetchType: "active",
    });

    return {
      activeOrganization: result,
      organizations,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ProjectChatProvider>
      <AppHeader />
      <div className="flex w-full flex-1 flex-col bg-background">
        <Outlet />
      </div>
    </ProjectChatProvider>
  );
}
