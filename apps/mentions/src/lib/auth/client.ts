import { createAuthClient } from "@rectangular-labs/auth/client";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { clientEnv } from "../env";
import { authServerHandler } from "./server";

export const authClient = createAuthClient(clientEnv().VITE_MENTIONS_URL);

export const getCurrentSession = createIsomorphicFn()
  .server(async () => {
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
    const request = getWebRequest();
    const organizations = await authServerHandler.api.listOrganizations({
      headers: request.headers,
    });
    return organizations;
  })
  .client(async () => {
    const organizations = await authClient.organization.list();
    if (organizations.error) {
      throw new Error(
        organizations.error.message ??
          "Something went wrong loading organizations. Please try again",
      );
    }
    return organizations.data;
  });
