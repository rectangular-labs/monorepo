import type { imageSettingsSchema } from "@rectangular-labs/db/parsers";
import { ok, safe } from "@rectangular-labs/result";
import type { InitialContext } from "../../types";
import { getImageFileNameFromUri } from "./get-image-file-name-from-uri";

function getMimeTypeFromFileName(fileName: string) {
  const extension = fileName.split(".").pop();
  switch (extension) {
    case "jpg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

export async function getImageSettingImages(
  imageSettings: typeof imageSettingsSchema.infer,
  imageBucket: InitialContext["projectImagesBucket"],
) {
  const styleReferences = await safe(() =>
    Promise.all(
      imageSettings.styleReferences.map(async (styleReference) => {
        const images = await Promise.all(
          styleReference.uris.map(async (uri) => {
            const image =
              await imageBucket.getItemRaw<Uint8Array<ArrayBuffer>>(uri);
            if (!image) {
              throw new Error("Invalid image URI");
            }
            const fileName = getImageFileNameFromUri(uri);
            if (!fileName) {
              throw new Error("Invalid image URI");
            }
            const mimeType = getMimeTypeFromFileName(fileName);
            return new File([image], fileName, { type: mimeType });
          }),
        );
        return {
          ...styleReference,
          images,
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
        const images = await Promise.all(
          brandLogo.uris.map(async (uri) => {
            const image =
              await imageBucket.getItemRaw<Uint8Array<ArrayBuffer>>(uri);
            if (!image) {
              throw new Error("Invalid image URI");
            }
            const fileName = getImageFileNameFromUri(uri);
            if (!fileName) {
              throw new Error("Invalid image URI");
            }
            const mimeType = getMimeTypeFromFileName(fileName);
            return new File([image], fileName, { type: mimeType });
          }),
        );
        return {
          ...brandLogo,
          images,
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
