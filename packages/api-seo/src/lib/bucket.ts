import { createStorage, prefixStorage } from "unstorage";
import cloudflareR2BindingDriver from "unstorage/drivers/cloudflare-r2-binding";

export const createWorkspaceBucket = () => {
  const storage = createStorage({
    driver: cloudflareR2BindingDriver({ binding: "SEO_WORKSPACE_BUCKET" }),
  });
  const baseStorage = prefixStorage<Uint8Array>(storage, "content_workspaces");
  return {
    ...baseStorage,
    getSnapshot: async (key: string) => {
      const snapshot = await baseStorage.getItemRaw(key);
      if (!snapshot) {
        return null;
      }
      return new Uint8Array(snapshot);
    },
    setSnapshot: async (key: string, snapshot: Uint8Array) => {
      return await baseStorage.setItemRaw(key, snapshot);
    },
  };
};
