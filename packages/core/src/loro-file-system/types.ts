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
      status?: undefined;
      scheduledFor?: undefined;
      notes?: undefined;
      userId?: undefined;
      primaryKeyword?: undefined;
      workflowId?: undefined;
      outline?: undefined;
      content?: undefined;
    }
  | {
      type: "file";
      name: string;
      /**
       * ISO date string
       */
      createdAt: string;
      status: SeoFileStatus;
      /**
       * ISO date string
       */
      scheduledFor?: string;
      notes?: string;
      userId: string;
      /**
       * Primary keyword the content targets.
       */
      primaryKeyword: string;
      /**
       * workflow identifier for when the content is being generated.
       */
      workflowId?: string;
      outline?: string;
      content: LoroText;
    };

export type LoroDocMapping = {
  fs: LoroTree<FsNodePayload>;
};
