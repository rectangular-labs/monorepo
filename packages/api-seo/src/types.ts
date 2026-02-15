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
import type { InferUITools, UIDataTypes, UIMessage, UIMessageChunk } from "ai";
import type { Scheduler } from "partywhen";
import type { createPlannerToolsWithMetadata } from "./lib/ai/tools/planner-tools";
import type { createSkillTools } from "./lib/ai/tools/skill-tools";
import type { createTodoToolWithMetadata } from "./lib/ai/tools/todo-tool";
import type {
  createPublicImagesBucket,
  createWorkspaceBucket,
} from "./lib/bucket";
import type { router } from "./routes";
import type { SeoOnboardingWorkflowBinding } from "./workflows/onboarding-workflow";
import type { SeoPlannerWorkflowBinding } from "./workflows/planner-workflow";
import type { SeoStrategyPhaseGenerationWorkflowBinding } from "./workflows/strategy-phase-generation-workflow";
import type { SeoStrategySnapshotWorkflowBinding } from "./workflows/strategy-snapshot-workflow";
import type { SeoStrategySuggestionsWorkflowBinding } from "./workflows/strategy-suggestions-workflow";
import type { SeoWriterWorkflowBinding } from "./workflows/writer-workflow";

export type Router = UnlaziedRouter<typeof router>;
export type RouterClient = ORPCRouterClient<Router>;
export type RouterInputs = InferRouterInputs<Router>;
export type RouterOutputs = InferRouterOutputs<Router>;

type AiTools = InferUITools<
  ReturnType<typeof createSkillTools> &
    ReturnType<typeof createPlannerToolsWithMetadata>["tools"] &
    ReturnType<typeof createTodoToolWithMetadata>["tools"]
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
  seoPlannerWorkflow: SeoPlannerWorkflowBinding;
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
