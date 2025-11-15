import type {
  InferRouterInputs,
  InferRouterOutputs,
  RouterClient as ORPCRouterClient,
  UnlaziedRouter,
} from "@orpc/server";
import type { BaseContextWithAuth } from "@rectangular-labs/api-core/lib/types";
import type { DB } from "@rectangular-labs/db";
import type { InferUITools, UIDataTypes, UIMessage } from "ai";
import type { createDataforseoTool } from "./lib/ai-tools/dataforseo";
import type { createGscTool } from "./lib/ai-tools/google-search-console";
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
export type AiSeoUIMessage = UIMessage<unknown, UIDataTypes, AiTools>;
/**
 * Initial context type definition for oRPC procedures
 * This defines the required dependencies that must be passed when calling procedures
 */
export interface InitialContext extends BaseContextWithAuth {
  db: DB;
  url: URL;
  workspaceBucket: ReturnType<typeof createWorkspaceBucket>;
}

export interface WebSocketContext extends InitialContext {
  senderWebSocket: WebSocket;
  allWebSockets: WebSocket[];
  userId: string;
  sessionId: string;
  projectId: string;
  campaignId: string;
  organizationId: string;
}
