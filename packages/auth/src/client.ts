import {
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient as createAuthClientBase } from "better-auth/react";
import type { Auth } from "./server";

// Since better auth uses proxy for the client to route frontend calls to the backend, we don't actually need to pass any plugins here.
// the types on the frontend based of the CompleteAuthClient will suffice. The only thing we need to configure is the baseURL and server side plugins.
export const createAuthClient = (baseURL: string) => {
  return createAuthClientBase({
    baseURL,
    plugins: [inferAdditionalFields<Auth>(), organizationClient()],
  });
};
