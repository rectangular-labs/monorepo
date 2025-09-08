import { initAuthHandler } from "@rectangular-labs/auth";
import { createAuthClient } from "@rectangular-labs/auth/client";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { clientEnv, serverEnv } from "./env";

export const getCurrentSession = createIsomorphicFn()
  .server(async () => {
    const baseUrl = serverEnv().VITE_APP_URL;
    const auth = initAuthHandler(baseUrl);
    const request = getWebRequest();
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return session;
  })
  .client(async () => {
    const baseUrl = clientEnv().VITE_APP_URL;
    const auth = createAuthClient(baseUrl);
    const session = await auth.getSession();
    return session.data;
  });

export const authClient = createAuthClient(clientEnv().VITE_APP_URL);
