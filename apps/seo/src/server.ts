import handler from "@tanstack/react-start/server-entry";

type RequestContext = Record<string, never>;

declare module "@tanstack/react-start" {
  interface Register {
    server: {
      requestContext: RequestContext;
    };
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    return await handler.fetch(request, {
      context: {},
    });
  },
};

export { UserVMContainer } from "@rectangular-labs/api-user-vm/container";
