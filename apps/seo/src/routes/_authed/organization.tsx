import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  getUserOrganizations,
  setDefaultOrganization,
} from "~/lib/auth/client";

export const Route = createFileRoute("/_authed/organization")({
  component: OrganizationPage,
  loader: async () => {
    const organizations = await getUserOrganizations();
    if (!organizations.ok) {
      throw new Error(organizations.error.message);
    }
    const [organization] = organizations.value;
    if (!organization) {
      throw redirect({
        to: "/onboarding",
      });
    }
    const result = await setDefaultOrganization({
      organizationId: organization.id,
      organizationSlug: organization.slug,
    });
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    throw redirect({
      to: "/$organizationSlug",
      params: {
        organizationSlug: organization.slug,
      },
    });
  },
});

function OrganizationPage() {
  return null;
}
