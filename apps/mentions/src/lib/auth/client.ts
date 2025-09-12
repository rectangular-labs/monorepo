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
    const baseUrl = clientEnv().VITE_MENTIONS_URL;
    const auth = createAuthClient(baseUrl);
    const session = await auth.getSession();
    return session.data;
  });
