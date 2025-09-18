import type {
  RequestHeadersPluginContext,
  ResponseHeadersPluginContext,
} from "@orpc/server/plugins";

export interface BaseContext
  extends RequestHeadersPluginContext,
    ResponseHeadersPluginContext {}
