import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getApiClient } from "~/lib/api";
import {
  getUserOrganizations,
  setDefaultOrganization,
} from "~/lib/auth/client";

export const Route = createFileRoute("/_authed/$organizationSlug")({
  beforeLoad: async ({ params, location }) => {
    console.log("params", params);
    // auto route if org slug is 'organization'
    if (params.organizationSlug === "organization") {
      const [organizations, activeOrganization] = await Promise.all([
        getUserOrganizations(),
        getApiClient().organization.active(),
      ]);
      if (!organizations.ok) {
        throw new Error(organizations.error.message);
      }
      const [organization] = organizations.value;
      // redirect users to onboarding if they are not in an organization
      if (!organization) {
        throw redirect({
          to: "/onboarding",
        });
      }

      // already has an active organization, let's go to it
      if (activeOrganization?.slug) {
        throw redirect({
          to: location.href.replace("organization", activeOrganization.slug),
        });
      }

      // no active organization, set the default organization
      const result = await setDefaultOrganization({
        organizationId: organization.id,
        organizationSlug: organization.slug,
      });
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      throw redirect({
        to: location.href.replace("organization", organization.slug),
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
