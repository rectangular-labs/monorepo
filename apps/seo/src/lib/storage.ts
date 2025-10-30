import { env } from "cloudflare:workers";
import { createStorage, prefixStorage } from "unstorage";
import cloudflareR2BindingDriver from "unstorage/drivers/cloudflare-r2-binding";

const storage = createStorage({
  driver: cloudflareR2BindingDriver({ binding: env.seo_content_workspaces }),
});
export const workspaceStorage = prefixStorage<Uint8Array>(
  storage,
  "content_workspaces",
);
