import { createORPCClient } from "@orpc/client";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createOpenApiLink, createRpcLink } from "@rectangular-labs/api-core";
import contract from "./_open-api/orpc-contract.json";
import type { Router, RouterClient } from "./types";

export const rpcClient = (baseUrl: string): RouterClient =>
  createORPCClient(createRpcLink({ baseUrl, path: "/api/rpc" }));

export const rqApiClient = (baseUrl: string) =>
  createTanstackQueryUtils(rpcClient(baseUrl));

export const openApiClient = (baseUrl: string): RouterClient =>
  createORPCClient(
    createOpenApiLink({
      contract: contract as unknown as Router,
      baseUrl,
      path: "/api",
    }),
  );
