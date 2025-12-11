import { env as cloudflareEnv } from "cloudflare:workers";
import { AwsClient } from "aws4fetch";
import { apiEnv } from "../env";

export function createWorkspaceBucket() {
  // biome-ignore lint/suspicious/noExplicitAny: We don't pass in the actual value right now so don't have the correct typing
  const binding = (cloudflareEnv as any).SEO_WORKSPACE_BUCKET as R2Bucket;

  return {
    getSnapshot: async (key: string, options?: R2GetOptions) => {
      const snapshot = await binding.get(key, options);
      if (!snapshot) {
        return null;
      }
      return new Uint8Array(await snapshot.arrayBuffer());
    },
    setSnapshot: async (
      key: string,
      snapshot: Uint8Array,
      options?: R2PutOptions,
    ) => {
      return await binding.put(key, snapshot, options);
    },
    storeImage: async (key: string, value: Blob, options?: R2PutOptions) => {
      return await binding.put(key, value, options);
    },
  };
}

export function createPublicImagesBucket() {
  // biome-ignore lint/suspicious/noExplicitAny: We don't pass in the actual value right now so don't have the correct typing
  const binding = (cloudflareEnv as any).SEO_WORKSPACE_BUCKET as R2Bucket;

  return {
    storeImage: async (key: string, value: Blob, options?: R2PutOptions) => {
      return await binding.put(key, value, options);
    },
  };
}

export function createS3Client() {
  const env = apiEnv();

  const r2Url = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  const client = new AwsClient({
    service: "s3", // Required by SDK but not used by R2
    region: "auto", // Required by SDK but not used by R2
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  });

  return { client, r2Url };
}
