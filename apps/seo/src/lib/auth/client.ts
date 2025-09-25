import { createAuthClient } from "@rectangular-labs/auth/client";
import { clientEnv } from "../env";

export const authClient = createAuthClient(clientEnv().VITE_SEO_URL);
