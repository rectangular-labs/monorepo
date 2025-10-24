import { createORPCClient } from "@orpc/client";
import { createOpenApiLink } from "@rectangular-labs/api-core/lib/links";
import contract from "./_open-api/orpc-contract.json";
import type { Router, RouterClient } from "./types";

export { eventIteratorToUnproxiedDataStream } from "@orpc/client";
export const openApiClient = (baseUrl: string): RouterClient =>
  createORPCClient(
    createOpenApiLink({
      contract: contract as unknown as Router,
      baseUrl,
      path: "/api/user-vm",
    }),
  );
