import { createClient } from "@rectangular-labs/auth/client";
import { env } from "../../../../lib/env";

export const authClient = () =>
  createClient({
    clientID: "rectangular-labs-backend",
    issuer: env().VITE_AUTH_URL,
  });
