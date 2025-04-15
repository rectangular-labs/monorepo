import type { AppType } from "@rectangular-labs/backend";
import { hc } from "hono/client";
import { env } from "./env";

export const backend = hc<AppType>(
  import.meta.env.MODE === "development"
    ? "https://localhost:6969"
    : env.VITE_APP_URL,
);
