import type {
  RequestHeadersPluginContext,
  ResponseHeadersPluginContext,
} from "@orpc/server/plugins";
import type { Auth } from "@rectangular-labs/auth";

export interface BaseContext
  extends RequestHeadersPluginContext,
    ResponseHeadersPluginContext {}

export interface BaseContextWithAuth extends BaseContext {
  auth: Auth;
}
