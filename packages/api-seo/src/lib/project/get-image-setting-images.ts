import type { imageSettingsSchema } from "@rectangular-labs/core/schemas/project-parsers";
import { ok, safe } from "@rectangular-labs/result";
import { apiEnv } from "../../env";
import { createS3Client } from "../bucket";

export async function getImageSettingImages(
  imageSettings: typeof imageSettingsSchema.infer,
) {
  const env = apiEnv();
  const bucketName = env.CLOUDFLARE_R2_ORG_STORAGE_BUCKET_NAME;

  const { client, r2Url } = createS3Client();
  const expirationSeconds = 3600; // 1 hour

  const styleReferences = await safe(() =>
    Promise.all(
      imageSettings.styleReferences.map(async (styleReference) => {
        const presignedUris = await Promise.all(
          styleReference.uris.map(async (uri) => {
            const signedRequest = await client.sign(
              new Request(
                `${r2Url}/${bucketName}/${uri}?X-Amz-Expires=${expirationSeconds}`,
              ),
              {
                aws: { signQuery: true },
              },
            );
            return signedRequest.url.toString();
          }),
        );
        return {
          ...styleReference,
          uris: presignedUris,
        };
      }),
    ),
  );
  if (!styleReferences.ok) {
    return styleReferences;
  }
  const brandLogos = await safe(() =>
    Promise.all(
      imageSettings.brandLogos.map(async (brandLogo) => {
        const presignedUris = await Promise.all(
          brandLogo.uris.map(async (uri) => {
            const signedRequest = await client.sign(
              new Request(
                `${r2Url}/${bucketName}/${uri}?X-Amz-Expires=${expirationSeconds}`,
              ),
              {
                aws: { signQuery: true },
              },
            );
            return signedRequest.url.toString();
          }),
        );
        return {
          ...brandLogo,
          uris: presignedUris,
        };
      }),
    ),
  );
  if (!brandLogos.ok) {
    return brandLogos;
  }

  return ok({
    styleReferences: styleReferences.value,
    brandLogos: brandLogos.value,
  });
}
