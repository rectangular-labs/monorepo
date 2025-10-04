import { err, ok } from "@rectangular-labs/result";
import { logger, metadata } from "@trigger.dev/sdk";
import { type } from "arktype";

const TaskSchema = type({
  progress: "number",
  statusMessage: "string",
});

export function setTaskMetadata(values: Partial<typeof TaskSchema.infer>) {
  if (typeof values.progress === "number") {
    metadata.set("progress", values.progress);
  }
  if (values.statusMessage) {
    metadata.set("statusMessage", values.statusMessage);
  }
}

export function getTaskMetadata() {
  const parsedMetadata = TaskSchema(metadata.current());
  if (parsedMetadata instanceof type.errors) {
    logger.error("Invalid metadata", { error: parsedMetadata.summary });
    return err(parsedMetadata);
  }
  return ok(parsedMetadata);
}
