import { createHmac } from "node:crypto";
import { apiEnv } from "../env";

export function createSignature(payload: string) {
  return createHmac("sha256", apiEnv().AUTH_SEO_ENCRYPTION_KEY)
    .update(payload)
    .digest("hex");
}
