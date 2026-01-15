import { env as cloudflareEnv } from "cloudflare:workers";
import type { Scheduler } from "partywhen";

export function createScheduler() {
  // biome-ignore lint/suspicious/noExplicitAny: We don't pass in the actual value right now so don't have the correct typing
  const binding = (cloudflareEnv as any)
    .SCHEDULER as DurableObjectNamespace<Scheduler>;
  const id = binding.idFromName("seo-scheduler");
  return binding.get(id);
}
