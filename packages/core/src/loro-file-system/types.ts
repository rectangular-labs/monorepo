import type { LoroText, LoroTree } from "loro-crdt";
import type { articleTypeSchema } from "../schemas/content-parsers";

export type SeoFileStatus =
  | "suggested"
  | "queued"
  | "generating"
  | "generation-failed"
  | "pending-review"
  | "scheduled"
  | "published"
  | "suggestion-rejected"
  | "review-denied";

export type ArticleType = typeof articleTypeSchema.infer;

export type FsNodePayload =
  | {
      type: "dir";
      name: string;
      /**
       * ISO date string
       */
      createdAt: string;
      // doesn't exists on dir
      title?: undefined;
      description?: undefined;
      scheduledFor?: undefined;
      userId?: undefined;
      status?: undefined;
      primaryKeyword?: undefined;
      notes?: undefined;
      outline?: undefined;
      articleType?: undefined;
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
      title?: string;
      description?: string;
      /**
       * ISO date string
       */
      scheduledFor?: string;
      userId?: string;
      status: SeoFileStatus;
      /**
       * Primary keyword the content targets.
       */
      primaryKeyword: string;
      notes?: string;
      outline?: string;
      articleType?: ArticleType;
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
