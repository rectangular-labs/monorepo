import {
  addCreatedAtOnCreateMiddleware,
  addScheduledForWhenPlannedMiddleware,
  type FsNodePayload,
  type WriteToFilePublishingContext,
} from "@rectangular-labs/core/loro-file-system";
import { createWriteToFile } from "@rectangular-labs/loro-file-system";

export const loroWriter = createWriteToFile<
  FsNodePayload,
  WriteToFilePublishingContext
>({
  middleware: [
    addCreatedAtOnCreateMiddleware(),
    addScheduledForWhenPlannedMiddleware(),
  ],
});
