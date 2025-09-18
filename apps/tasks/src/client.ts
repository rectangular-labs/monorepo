import { createORPCClient } from "@orpc/client";
import { createRpcLink } from "@rectangular-labs/api-core/lib/links";
import type { RouterClient } from "./types";

export const rpcClient = (baseUrl: string): RouterClient =>
  createORPCClient(createRpcLink({ baseUrl, path: "/rpc" }));
