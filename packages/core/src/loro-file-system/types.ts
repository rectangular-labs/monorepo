import type { LoroText, LoroTree } from "loro-crdt";

export type SeoFileStatus =
  | "suggested"
  | "planned"
  | "generating"
  | "generation-failed"
  | "pending-review"
  | "scheduled"
  | "published"
  | "suggestion-rejected"
  | "review-denied";

export type FsNodePayload =
  | {
      type: "dir";
      name: string;
      /**
       * ISO date string
       */
      createdAt: string;
      // doesn't exists on dir
      scheduledFor?: undefined;
      userId?: undefined;
      status?: undefined;
      primaryKeyword?: undefined;
      notes?: undefined;
      outline?: undefined;
      workflowId?: undefined;
      error?: undefined;
      content?: undefined;
    }
  | {
      type: "file";
      name: string;
      /**
       * ISO date string
       */
      createdAt: string;
      /**
       * ISO date string
       */
      scheduledFor?: string;
      userId: string;
      status: SeoFileStatus;
      /**
       * Primary keyword the content targets.
       */
      primaryKeyword: string;
      notes?: string;
      outline?: string;
      /**
       * workflow identifier for when the content is being generated.
       */
      workflowId?: string;
      error?: string;
      content: LoroText;
    };

export type LoroDocMapping = {
  fs: LoroTree<FsNodePayload>;
};
