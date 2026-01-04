import { env as cloudflareEnv } from "cloudflare:workers";
import { err, ok, type Result, safe } from "@rectangular-labs/result";
import type { InitialContext } from "../../../types";

function getImagesBinding(): ImagesBinding {
  // biome-ignore lint/suspicious/noExplicitAny: Cloudflare bindings are injected at runtime.
  return (cloudflareEnv as any).IMAGES;
}

async function tryConvertToWebp(
  bytes: Uint8Array,
): Promise<Result<Uint8Array, Error>> {
  try {
    const images = getImagesBinding();
    if (!images) {
      return err(new Error("Cloudflare IMAGES binding not configured"));
    }

    const response = (
      await images
        .input(
          new ReadableStream({
            start(controller) {
              controller.enqueue(bytes);
            },
          }),
        )
        .output({ format: "image/webp" })
    ).response();

    if (!(response instanceof Response) || !response.ok) {
      return err(
        new Error(
          `Cloudflare IMAGES conversion failed (${(response as Response | undefined)?.status ?? "unknown"})`,
        ),
      );
    }

    const webpBytes = new Uint8Array(await response.arrayBuffer());
    return ok(webpBytes);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

function inferWebpKey(key: string): string {
  const lastSlash = key.lastIndexOf("/");
  const lastDot = key.lastIndexOf(".");
  if (lastDot > lastSlash) {
    return `${key.slice(0, lastDot + 1)}webp`;
  }
  return `${key}.webp`;
}

export async function storeOptimizedOrOriginalImage(args: {
  bucket: InitialContext["publicImagesBucket"];
  bytes: Uint8Array;
  key: string;
  mimeType: string;
  webpKeyOverride?: string;
}): Promise<
  Result<{ key: string; contentType: string; byteLength: number }, Error>
> {
  const { bytes: originalBytes, mimeType: originalType } = args;

  const shouldAttemptWebp = !originalType.toLowerCase().includes("image/webp");
  const webpResult = shouldAttemptWebp
    ? await tryConvertToWebp(originalBytes)
    : err(new Error("Already webp"));
  const webpKey = args.webpKeyOverride ?? inferWebpKey(args.key);

  const useWebp =
    webpResult.ok && webpResult.value.byteLength < originalBytes.byteLength;

  if (useWebp) {
    console.log("Storing optimized webp", webpKey, originalBytes.byteLength);
    const storeWebp = await safe(() =>
      args.bucket.storeImage(
        webpKey,
        new Blob([new Uint8Array(webpResult.value)], { type: "image/webp" }),
        {
          httpMetadata: { contentType: "image/webp" },
        },
      ),
    );

    if (storeWebp.ok) {
      return ok({
        key: webpKey,
        contentType: "image/webp",
        byteLength: webpResult.value.byteLength,
      });
    }
  }

  console.log("Storing original", args.key, originalType);
  // if failed to store webp/if original is smaller than webp/image is already webp, try to store original
  const storeOriginal = await safe(() =>
    args.bucket.storeImage(
      args.key,
      new Blob([new Uint8Array(originalBytes)], { type: originalType }),
      {
        httpMetadata: { contentType: originalType },
      },
    ),
  );
  if (!storeOriginal.ok) return storeOriginal;

  return ok({
    key: args.key,
    contentType: originalType,
    byteLength: originalBytes.byteLength,
  });
}
