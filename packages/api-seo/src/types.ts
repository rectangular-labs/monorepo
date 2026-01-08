import type {
  InferRouterInputs,
  InferRouterOutputs,
  RouterClient as ORPCRouterClient,
  UnlaziedRouter,
} from "@orpc/server";
import type { BaseContextWithAuth } from "@rectangular-labs/api-core/lib/types";
import type { chatMessageMetadataSchema } from "@rectangular-labs/core/schemas/chat-message-parser";
import type {
  seoPlanKeywordTaskInputSchema,
  seoWriteArticleTaskInputSchema,
} from "@rectangular-labs/core/schemas/task-parsers";
import type { DB, schema } from "@rectangular-labs/db";
import type { InferUITools, UIDataTypes, UIMessage, UIMessageChunk } from "ai";
import type { CrdtServerAdaptor } from "loro-adaptors";
import type { DocUpdateFragmentHeader, HexString } from "loro-protocol";
import type { createPlannerToolsWithMetadata } from "./lib/ai/tools/planner-tools";
import type { createSkillTools } from "./lib/ai/tools/skill-tools";
import type { createSuggestArticlesToolWithMetadata } from "./lib/ai/tools/suggest-articles-tool";
import type { createTodoToolWithMetadata } from "./lib/ai/tools/todo-tool";
import type {
  createPublicImagesBucket,
  createWorkspaceBucket,
} from "./lib/bucket";
import type { router, websocketRouter } from "./routes";

export type Router = UnlaziedRouter<typeof router>;
export type RouterClient = ORPCRouterClient<Router>;
export type RouterInputs = InferRouterInputs<Router>;
export type RouterOutputs = InferRouterOutputs<Router>;

export type WebsocketRouter = UnlaziedRouter<typeof websocketRouter>;
export type WebsocketRouterClient = ORPCRouterClient<WebsocketRouter>;

type AiTools = InferUITools<
  ReturnType<typeof createSkillTools> &
    ReturnType<typeof createPlannerToolsWithMetadata>["tools"] &
    ReturnType<typeof createTodoToolWithMetadata>["tools"] &
    ReturnType<typeof createSuggestArticlesToolWithMetadata>["tools"]
>;
export type SeoChatMessage = UIMessage<
  typeof chatMessageMetadataSchema.infer,
  UIDataTypes,
  AiTools
>;
export type WebSocketMessages =
  | { type: "new-msg"; message: SeoChatMessage }
  | {
      type: "msg-chunk";
      clientMessageId: string;
      chunk: UIMessageChunk<
        typeof chatMessageMetadataSchema.infer,
        UIDataTypes
      >;
    };

/**
 * Initial context type definition for oRPC procedures
 * This defines the required dependencies that must be passed when calling procedures
 */
export interface InitialContext extends BaseContextWithAuth {
  db: DB;
  url: URL;
  workspaceBucket: ReturnType<typeof createWorkspaceBucket>;
  publicImagesBucket: ReturnType<typeof createPublicImagesBucket>;
  seoPlannerWorkflow: Workflow<typeof seoPlanKeywordTaskInputSchema.infer>;
  seoWriterWorkflow: Workflow<typeof seoWriteArticleTaskInputSchema.infer>;
  cacheKV: KVNamespace;
}

export interface ChatContext extends InitialContext {
  userId: string;
  sessionId: string;
  projectId: string;
  organizationId: string;
  roomDocumentMap: Map<string, RoomDocument>;
  cache: {
    messages?: Record<string, SeoChatMessage>;
    project?: typeof schema.seoProject.$inferSelect & {
      authors?: (typeof schema.seoProjectAuthor.$inferSelect)[];
    };
    gscProperty?: typeof schema.seoGscProperty.$inferSelect & {
      accessToken?: string;
    };
  };
}

/**
 * This provides all the necessary context for the websocket server.
 * Today this handles all the chat messages between the user and the assistant.
 */
export interface WebSocketContext extends ChatContext {
  senderWebSocket: WebSocket;
  allWebSockets: WebSocket[];
  campaignId: string;
  campaignTitle: string;
  updateCampaignTitle: (title: string) => void;
  userFragments: Map<HexString, UserFragment>;
}

/**
 * This handles the logic for the Loro sync server.
 */
export interface RoomDocument {
  data: Uint8Array;
  dirty: boolean;
  lastSaved: number;
  descriptor: {
    shouldPersist: boolean;
    allowBackfillWhenNoOtherClients: boolean;
    adaptor: CrdtServerAdaptor;
  };
}
export interface UserFragment {
  data: Uint8Array[];
  totalSize: number;
  received: number;
  header: DocUpdateFragmentHeader;
}
