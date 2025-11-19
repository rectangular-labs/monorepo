import type {
  InferRouterInputs,
  InferRouterOutputs,
  RouterClient as ORPCRouterClient,
  UnlaziedRouter,
} from "@orpc/server";
import type { BaseContextWithAuth } from "@rectangular-labs/api-core/lib/types";
import type { DB } from "@rectangular-labs/db";
import type { contentCampaignMessageMetadataSchema } from "@rectangular-labs/db/parsers";
import type { InferUITools, UIDataTypes, UIMessage, UIMessageChunk } from "ai";
import type { CrdtServerAdaptor } from "loro-adaptors";
import type { DocUpdateFragmentHeader, HexString } from "loro-protocol";
import type { createDataforseoTool } from "./lib/ai/dataforseo-tool";
import type { createGscTool } from "./lib/ai/google-search-console-tool";
import type { createWorkspaceBucket } from "./lib/bucket";
import type { router, websocketRouter } from "./routes";

export type Router = UnlaziedRouter<typeof router>;
export type RouterClient = ORPCRouterClient<Router>;
export type RouterInputs = InferRouterInputs<Router>;
export type RouterOutputs = InferRouterOutputs<Router>;

export type WebsocketRouter = UnlaziedRouter<typeof websocketRouter>;
export type WebsocketRouterClient = ORPCRouterClient<WebsocketRouter>;

type AiTools = InferUITools<
  ReturnType<typeof createDataforseoTool> & ReturnType<typeof createGscTool>
>;
export type SeoChatMessage = UIMessage<
  typeof contentCampaignMessageMetadataSchema.infer,
  UIDataTypes,
  AiTools
>;
export type WebSocketMessages =
  | { type: "new-msg"; message: SeoChatMessage }
  | {
      type: "msg-chunk";
      clientMessageId: string;
      chunk: UIMessageChunk<
        typeof contentCampaignMessageMetadataSchema.infer,
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
}

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

export interface WebSocketContext extends InitialContext {
  senderWebSocket: WebSocket;
  allWebSockets: WebSocket[];
  userId: string;
  sessionId: string;
  projectId: string;
  campaignId: string;
  organizationId: string;
  roomDocumentMap: Map<string, RoomDocument>;
  userFragments: Map<HexString, UserFragment>;
}
