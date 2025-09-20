import { err, ok } from "@rectangular-labs/result";
import { logger, metadata } from "@trigger.dev/sdk";
import { type } from "arktype";

const UnderstandSiteSchema = type({
  progress: "number",
  statusMessage: "string",
});

export function setUnderstandSiteMetadata(
  values: Partial<typeof UnderstandSiteSchema.infer>,
) {
  if (typeof values.progress === "number") {
    metadata.set("progress", values.progress);
  }
  if (values.statusMessage) {
    metadata.set("statusMessage", values.statusMessage);
  }
}

export function getUnderstandSiteMetadata() {
  const parsedMetadata = UnderstandSiteSchema(metadata.current());
  if (parsedMetadata instanceof type.errors) {
    logger.error("Invalid metadata", { error: parsedMetadata.summary });
    return err(parsedMetadata);
  }
  return ok(parsedMetadata);
}
