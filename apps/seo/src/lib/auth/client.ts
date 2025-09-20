import { createAuthClient } from "@rectangular-labs/auth/client";
import { err, ok, safe } from "@rectangular-labs/result";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { clientEnv } from "../env";

export const authClient = createAuthClient(clientEnv().VITE_SEO_URL);

export const getCurrentSession = createIsomorphicFn()
  .server(async () => {
    const { authServerHandler } = await import("./server");
    const request = getWebRequest();
    const session = await authServerHandler.api.getSession({
      headers: request.headers,
    });
    return session;
  })
  .client(async () => {
    const session = await authClient.getSession();
    return session.data;
  });

export const getUserOrganizations = createIsomorphicFn()
  .server(async () => {
    const { authServerHandler } = await import("./server");
    const request = getWebRequest();
    const organizations = await safe(() =>
      authServerHandler.api.listOrganizations({
        headers: request.headers,
      }),
    );

    return organizations;
  })
  .client(async () => {
    const organizations = await authClient.organization.list();
    if (organizations.error) {
      return err(
        new Error(
          organizations.error.message ??
            "Something went wrong loading organizations. Please try again",
        ),
      );
    }
    return ok(organizations.data);
  });

export const setDefaultOrganization = createIsomorphicFn()
  .server(
    async (args: { organizationId: string; organizationSlug: string }) => {
      const { authServerHandler } = await import("./server");
      const request = getWebRequest();
      const organization = await safe(() =>
        authServerHandler.api.setActiveOrganization({
          headers: request.headers,
          body: args,
        }),
      );
      return organization;
    },
  )
  .client(
    async (args: { organizationId: string; organizationSlug: string }) => {
      const organization = await authClient.organization.setActive(args);
      if (organization.error) {
        return err(
          new Error(
            organization.error.message ??
              "Something went wrong setting the default organization. Please try again",
          ),
        );
      }
      return ok(organization.data);
    },
  );
