import type {
  InferRouterInputs,
  InferRouterOutputs,
  RouterClient as ORPCRouterClient,
  UnlaziedRouter,
} from "@orpc/server";
import type { BaseContextWithAuth } from "@rectangular-labs/api-core/lib/types";
import type { chatMessageMetadataSchema } from "@rectangular-labs/core/schemas/chat-message-parser";
import type { GscConfig } from "@rectangular-labs/core/schemas/integration-parsers";
import type { DB, schema } from "@rectangular-labs/db";
import type { InferAgentUIMessage } from "ai";
import type { Scheduler } from "partywhen";
import type { createOrchestrator } from "./lib/ai/agents/orchestrator";
import type {
  createPublicImagesBucket,
  createWorkspaceBucket,
} from "./lib/bucket";
import type { router } from "./routes";
import type { SeoOnboardingWorkflowBinding } from "./workflows/onboarding-workflow";
import type { SeoStrategyPhaseGenerationWorkflowBinding } from "./workflows/strategy-phase-generation-workflow";
import type { SeoStrategySnapshotWorkflowBinding } from "./workflows/strategy-snapshot-workflow";
import type { SeoStrategySuggestionsWorkflowBinding } from "./workflows/strategy-suggestions-workflow";
import type { SeoWriterWorkflowBinding } from "./workflows/writer-workflow";

export type Router = UnlaziedRouter<typeof router>;
export type RouterClient = ORPCRouterClient<Router>;
export type RouterInputs = InferRouterInputs<Router>;
export type RouterOutputs = InferRouterOutputs<Router>;

export type SeoChatMessage = InferAgentUIMessage<
  ReturnType<typeof createOrchestrator>,
  typeof chatMessageMetadataSchema.infer
>;

/**
 * Initial context type definition for oRPC procedures
 * This defines the required dependencies that must be passed when calling procedures
 */
export interface InitialContext extends BaseContextWithAuth {
  db: DB;
  url: URL;
  workspaceBucket: ReturnType<typeof createWorkspaceBucket>;
  publicImagesBucket: ReturnType<typeof createPublicImagesBucket>;
  seoWriterWorkflow: SeoWriterWorkflowBinding;
  seoOnboardingWorkflow: SeoOnboardingWorkflowBinding;
  seoStrategySuggestionsWorkflow: SeoStrategySuggestionsWorkflowBinding;
  seoStrategyPhaseGenerationWorkflow: SeoStrategyPhaseGenerationWorkflowBinding;
  seoStrategySnapshotWorkflow: SeoStrategySnapshotWorkflowBinding;
  cacheKV: KVNamespace;
  scheduler: DurableObjectStub<Scheduler>;
}

export interface ChatContext extends InitialContext {
  userId: string;
  chatId: string;
  sessionId: string;
  projectId: string;
  organizationId: string;
  cache: {
    messages?: Record<string, SeoChatMessage>;
    project?: typeof schema.seoProject.$inferSelect & {
      authors?: (typeof schema.seoProjectAuthor.$inferSelect)[];
    };
    gscProperty?: {
      id: string;
      accountId: string;
      config: GscConfig;
      accessToken?: string;
    };
    chat?: typeof schema.seoChat.$inferSelect;
  };
}
