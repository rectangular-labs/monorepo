import { env as cloudflareEnv } from "cloudflare:workers";

export function createKvStore() {
  return {
    // biome-ignore lint/suspicious/noExplicitAny: We don't pass in the actual value right now so don't have the correct typing
    cacheKV: (cloudflareEnv as any).CACHE as KVNamespace,
  };
}
