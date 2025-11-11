import { createAuthClient } from "@rectangular-labs/auth/client";
import { clientEnv } from "./env";

export const authClient = createAuthClient(clientEnv().VITE_SEO_URL);

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters";
export function linkGoogleAccountForGsc(options: { callbackURL: string }) {
  return authClient.linkSocial({
    provider: "google",
    callbackURL: options.callbackURL,
    scopes: [GSC_SCOPE],
  });
}
