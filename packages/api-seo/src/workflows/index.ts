import { env as cloudflareEnv } from "cloudflare:workers";
import type {
  seoPlanKeywordTaskInputSchema,
  seoWriteArticleTaskInputSchema,
} from "@rectangular-labs/core/schemas/task-parsers";

export const createWorkflows = () => {
  const castEnv = cloudflareEnv as {
    SEO_PLANNER_WORKFLOW: Workflow<typeof seoPlanKeywordTaskInputSchema.infer>;
    SEO_WRITER_WORKFLOW: Workflow<typeof seoWriteArticleTaskInputSchema.infer>;
  };
  return {
    seoPlannerWorkflow: castEnv.SEO_PLANNER_WORKFLOW,
    seoWriterWorkflow: castEnv.SEO_WRITER_WORKFLOW,
  };
};
export { SeoPlannerWorkflow } from "./planner-workflow";
export { SeoWriterWorkflow } from "./writer-workflow";
