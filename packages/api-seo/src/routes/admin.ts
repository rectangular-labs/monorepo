import { waitUntil } from "cloudflare:workers";
import { ORPCError } from "@orpc/server";
import { eq, schema } from "@rectangular-labs/db";
import { updateSeoProject } from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { protectedBase } from "../context";
import { contentFixtures } from "../eval/content/fixtures/index";
import { scoreContent } from "../eval/content/score";
import { strategyFixtures } from "../eval/strategy/fixtures/index";
import { scoreStrategy } from "../eval/strategy/score";
import type { ContentFixture, StrategyFixture } from "../eval/types";
import { createStrategyAdvisorAgent } from "../lib/ai/agents/strategy-advisor";
import { createWriterAgent } from "../lib/ai/agents/writer";
import { createTask } from "../lib/task";

const EVAL_GENERATION_TTL_SECONDS = 60 * 60 * 24; // 1 day
const EVAL_GENERATION_KEY_PREFIX = "eval:generation:";

const triggerOnboardingTask = protectedBase
  .route({ method: "POST", path: "/trigger-onboarding-task" })
  .input(type({ organizationSlug: "string", projectSlug: "string" }))
  .output(
    type({
      projectId: "string",
      organizationId: "string",
      taskId: "string",
    }),
  )
  .handler(async ({ context, input }) => {
    if (!context.user.email?.endsWith("@fluidposts.com")) {
      throw new ORPCError("FORBIDDEN", { message: "Not authorized" });
    }

    const db = context.db;
    const organizationResult = await db.query.organization.findFirst({
      where: eq(schema.organization.slug, input.organizationSlug),
    });

    if (!organizationResult) {
      throw new ORPCError("NOT_FOUND", { message: "Organization not found" });
    }

    const projectResult = await db.query.seoProject.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.organizationId, organizationResult.id),
          eq(table.slug, input.projectSlug),
        ),
    });

    if (!projectResult) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    const createTaskResult = await createTask({
      db,
      userId: context.user.id,
      input: {
        type: "seo-understand-site",
        projectId: projectResult.id,
      },
    });

    if (!createTaskResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: createTaskResult.error.message,
      });
    }

    await updateSeoProject(db, {
      id: projectResult.id,
      organizationId: projectResult.organizationId,
      projectResearchWorkflowId: createTaskResult.value.id,
    });

    return {
      projectId: projectResult.id,
      organizationId: projectResult.organizationId,
      taskId: createTaskResult.value.id,
    };
  });

const triggerStrategySuggestionsTask = protectedBase
  .route({ method: "POST", path: "/trigger-strategy-suggestions-task" })
  .input(
    type({
      organizationSlug: "string",
      projectSlug: "string",
      instructions: "string",
    }),
  )
  .output(
    type({
      projectId: "string",
      organizationId: "string",
      taskId: "string",
    }),
  )
  .handler(async ({ context, input }) => {
    if (!context.user.email?.endsWith("@fluidposts.com")) {
      throw new ORPCError("FORBIDDEN", { message: "Not authorized" });
    }

    const db = context.db;
    const organizationResult = await db.query.organization.findFirst({
      where: eq(schema.organization.slug, input.organizationSlug),
    });

    if (!organizationResult) {
      throw new ORPCError("NOT_FOUND", { message: "Organization not found" });
    }

    const projectResult = await db.query.seoProject.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.organizationId, organizationResult.id),
          eq(table.slug, input.projectSlug),
        ),
    });

    if (!projectResult) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    const createTaskResult = await createTask({
      db,
      userId: context.user.id,
      input: {
        type: "seo-generate-strategy-suggestions",
        projectId: projectResult.id,
        instructions: input.instructions,
      },
    });

    if (!createTaskResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: createTaskResult.error.message,
      });
    }

    return {
      projectId: projectResult.id,
      organizationId: projectResult.organizationId,
      taskId: createTaskResult.value.id,
    };
  });

const triggerStrategyPhaseGenerationTask = protectedBase
  .route({ method: "POST", path: "/trigger-strategy-phase-generation-task" })
  .input(
    type({
      organizationSlug: "string",
      projectSlug: "string",
      strategyName: "string",
    }),
  )
  .output(
    type({
      projectId: "string",
      organizationId: "string",
      strategyId: "string",
      taskId: "string",
    }),
  )
  .handler(async ({ context, input }) => {
    if (!context.user.email?.endsWith("@fluidposts.com")) {
      throw new ORPCError("FORBIDDEN", { message: "Not authorized" });
    }

    const db = context.db;

    const organizationResult = await db.query.organization.findFirst({
      where: eq(schema.organization.slug, input.organizationSlug),
    });

    if (!organizationResult) {
      throw new ORPCError("NOT_FOUND", { message: "Organization not found" });
    }

    const projectResult = await db.query.seoProject.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.organizationId, organizationResult.id),
          eq(table.slug, input.projectSlug),
        ),
    });

    if (!projectResult) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    const strategyResults = await db.query.seoStrategy.findMany({
      where: (table, { and, eq, isNull }) =>
        and(
          eq(table.organizationId, organizationResult.id),
          eq(table.projectId, projectResult.id),
          eq(table.name, input.strategyName),
          isNull(table.deletedAt),
        ),
      limit: 2,
      orderBy: (fields, { desc }) => [desc(fields.updatedAt)],
    });

    if (strategyResults.length === 0) {
      throw new ORPCError("NOT_FOUND", { message: "Strategy not found" });
    }

    if (strategyResults.length > 1) {
      throw new ORPCError("BAD_REQUEST", {
        message:
          "Multiple strategies found with that name. Please rename the strategy and try again.",
      });
    }

    const strategy = strategyResults[0];
    if (!strategy) {
      throw new ORPCError("NOT_FOUND", { message: "Strategy not found" });
    }

    const createTaskResult = await createTask({
      db,
      userId: undefined,
      input: {
        type: "seo-generate-strategy-phase",
        projectId: projectResult.id,
        organizationId: organizationResult.id,
        strategyId: strategy.id,
        userId: undefined,
      },
      workflowInstanceId: `strategy_phase_generation_${strategy.id}_${crypto.randomUUID().slice(0, 6)}`,
    });

    if (!createTaskResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: createTaskResult.error.message,
      });
    }

    return {
      projectId: projectResult.id,
      organizationId: organizationResult.id,
      strategyId: strategy.id,
      taskId: createTaskResult.value.id,
    };
  });

function buildEvalProjectFromContentFixture(
  fixture: ContentFixture,
): typeof schema.seoProject.$inferSelect {
  const now = new Date();
  return {
    id: `eval-content-${fixture.id}`,
    slug: fixture.id,
    name: fixture.input.project.name,
    organizationId: "eval-org",
    websiteUrl: fixture.input.project.websiteUrl,
    businessBackground: {
      version: "v1",
      businessOverview: fixture.input.project.businessBackground,
      targetAudience: "Website readers and prospective buyers",
      caseStudies: [],
      competitorsWebsites: [],
      industry: "Software",
      targetCountryCode: "US",
      targetCity: "San Francisco",
      languageCode: "en",
    },
    imageSettings: {
      version: "v1",
      styleReferences: [],
      brandLogos: [],
      imageInstructions: "",
      stockImageProviders: ["unsplash", "pexels", "pixabay"],
    },
    writingSettings: {
      version: "v1",
      brandVoice: fixture.input.project.brandVoice,
      customInstructions: fixture.input.project.customInstructions,
    },
    publishingSettings: {
      version: "v1",
      requireContentReview: false,
      requireSuggestionReview: false,
      participateInLinkExchange: true,
    },
    projectResearchWorkflowId: null,
    strategySuggestionsWorkflowId: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function buildEvalProjectFromStrategyFixture(
  fixture: StrategyFixture,
): typeof schema.seoProject.$inferSelect {
  const now = new Date();
  return {
    id: `eval-strategy-${fixture.id}`,
    slug: fixture.id,
    name: fixture.input.site.name,
    organizationId: "eval-org",
    websiteUrl: fixture.input.site.websiteUrl,
    businessBackground: {
      version: "v1",
      businessOverview: fixture.input.site.businessBackground,
      targetAudience: "Potential customers",
      caseStudies: [],
      competitorsWebsites: [],
      industry: fixture.input.site.industry,
      targetCountryCode: "US",
      targetCity: "San Francisco",
      languageCode: "en",
    },
    imageSettings: {
      version: "v1",
      styleReferences: [],
      brandLogos: [],
      imageInstructions: "",
      stockImageProviders: ["unsplash", "pexels", "pixabay"],
    },
    writingSettings: {
      version: "v1",
      brandVoice: "Clear, practical, and data-backed.",
      customInstructions: "",
    },
    publishingSettings: {
      version: "v1",
      requireContentReview: false,
      requireSuggestionReview: false,
      participateInLinkExchange: true,
    },
    projectResearchWorkflowId: null,
    strategySuggestionsWorkflowId: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function assertFluidpostsEmail(email: string | null | undefined): void {
  if (!email?.endsWith("@fluidposts.com")) {
    throw new ORPCError("FORBIDDEN", { message: "Not authorized" });
  }
}

function toJsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  if (Array.isArray(value)) {
    return value.map((item) => toJsonSafe(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, toJsonSafe(item)]),
    );
  }
  return value;
}

function getEvalGenerationKey(jobId: string): string {
  return `${EVAL_GENERATION_KEY_PREFIX}${jobId}`;
}

interface EvalGenerationStatusValue {
  jobId: string;
  status: "pending" | "completed" | "failed";
  type: "content" | "strategy";
  fixtureId: string;
  output: string | null;
  generatedAt: string | null;
  outputFileName: string | null;
  stepsJson: string | null;
  stepsFileName: string | null;
  durationMs: number | null;
  error: string | null;
}

async function putEvalGenerationStatus(
  cacheKV: KVNamespace,
  value: EvalGenerationStatusValue,
): Promise<void> {
  await cacheKV.put(getEvalGenerationKey(value.jobId), JSON.stringify(value), {
    expirationTtl: EVAL_GENERATION_TTL_SECONDS,
  });
}

async function runEvalGenerationJob(args: {
  cacheKV: KVNamespace;
  db: Parameters<typeof createWriterAgent>[0]["db"];
  publicImagesBucket: Parameters<
    typeof createWriterAgent
  >[0]["publicImagesBucket"];
  type: "content" | "strategy";
  fixture: ContentFixture | StrategyFixture;
  jobId: string;
}): Promise<void> {
  try {
    const start = Date.now();
    const createdAt = new Date();

    if (args.type === "content") {
      const fixture = args.fixture as ContentFixture;
      const { agent } = createWriterAgent({
        db: args.db,
        project: buildEvalProjectFromContentFixture(fixture),
        messages: [],
        cacheKV: args.cacheKV,
        publicImagesBucket: args.publicImagesBucket,
        mode: "chat",
        articleType: fixture.input.articleType,
        primaryKeyword: fixture.input.primaryKeyword,
      });

      const task = `Write a complete markdown article.

Title: ${fixture.input.title}
Primary keyword: ${fixture.input.primaryKeyword}
Article type: ${fixture.input.articleType}
Expected length: ${fixture.expectations.minWordCount}-${fixture.expectations.maxWordCount} words
${fixture.input.notes ? `Notes: ${fixture.input.notes}` : ""}
${fixture.input.outline ? `Outline: ${fixture.input.outline}` : ""}`;

      const draft = await agent.generate({
        prompt: task,
      });

      await putEvalGenerationStatus(args.cacheKV, {
        jobId: args.jobId,
        status: "completed",
        type: "content",
        fixtureId: fixture.id,
        output: draft.text,
        generatedAt: createdAt.toISOString(),
        outputFileName: `${fixture.id}-${createdAt.toISOString().replace(/[:.]/g, "-")}.md`,
        stepsJson: JSON.stringify(
          {
            fixtureId: fixture.id,
            type: "content",
            timestamp: createdAt.toISOString(),
            steps: toJsonSafe(draft.steps ?? []),
          },
          null,
          2,
        ),
        stepsFileName: `${fixture.id}-${createdAt.toISOString().replace(/[:.]/g, "-")}-steps.json`,
        durationMs: Date.now() - start,
        error: null,
      });
      return;
    }

    const fixture = args.fixture as StrategyFixture;
    const { agent } = createStrategyAdvisorAgent({
      db: args.db,
      project: buildEvalProjectFromStrategyFixture(fixture),
      cacheKV: args.cacheKV,
      gscProperty: null,
    });

    const result = await agent.generate({
      prompt: `Generate exactly 2 SEO strategy suggestions for this project.

${fixture.input.instructions}

Output requirements:
- Provide exactly 2 distinct strategy options.
- For each option include rationale, keyword clusters, intent mapping, prioritization plan, and realistic timeline expectations.
- Keep recommendations specific and execution-ready.
- Return plain markdown text only (no JSON).`,
    });

    await putEvalGenerationStatus(args.cacheKV, {
      jobId: args.jobId,
      status: "completed",
      type: "strategy",
      fixtureId: fixture.id,
      output: result.text,
      generatedAt: createdAt.toISOString(),
      outputFileName: `${fixture.id}-${createdAt.toISOString().replace(/[:.]/g, "-")}.md`,
      stepsJson: JSON.stringify(
        {
          fixtureId: fixture.id,
          type: "strategy",
          timestamp: createdAt.toISOString(),
          steps: toJsonSafe(result.steps ?? []),
        },
        null,
        2,
      ),
      stepsFileName: `${fixture.id}-${createdAt.toISOString().replace(/[:.]/g, "-")}-steps.json`,
      durationMs: Date.now() - start,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await putEvalGenerationStatus(args.cacheKV, {
      jobId: args.jobId,
      status: "failed",
      type: args.type,
      fixtureId: args.fixture.id,
      output: null,
      generatedAt: null,
      outputFileName: null,
      stepsJson: null,
      stepsFileName: null,
      durationMs: null,
      error: message,
    });
  }
}

const listEvalFixtures = protectedBase
  .route({ method: "GET", path: "/eval/fixtures" })
  .output(
    type({
      content: type({ id: "string", description: "string" }).array(),
      strategy: type({ id: "string", description: "string" }).array(),
    }),
  )
  .handler(({ context }) => {
    assertFluidpostsEmail(context.user.email);

    return {
      content: contentFixtures.map((fixture) => ({
        id: fixture.id,
        description: fixture.description,
      })),
      strategy: strategyFixtures.map((fixture) => ({
        id: fixture.id,
        description: fixture.description,
      })),
    };
  });

const generateEvalOutput = protectedBase
  .route({ method: "POST", path: "/eval/generate" })
  .input(
    type({
      type: "'content'|'strategy'",
      fixtureId: "string",
    }),
  )
  .output(
    type({
      jobId: "string",
      status: "'pending'",
      type: "'content'|'strategy'",
      fixtureId: "string",
    }),
  )
  .handler(async ({ context, input }) => {
    assertFluidpostsEmail(context.user.email);

    if (input.type === "content") {
      const fixture = contentFixtures.find(
        (item) => item.id === input.fixtureId,
      );
      if (!fixture) {
        throw new ORPCError("NOT_FOUND", { message: "Fixture not found" });
      }

      const jobId = crypto.randomUUID();
      await putEvalGenerationStatus(context.cacheKV, {
        jobId,
        status: "pending",
        type: "content",
        fixtureId: fixture.id,
        output: null,
        generatedAt: null,
        outputFileName: null,
        stepsJson: null,
        stepsFileName: null,
        durationMs: null,
        error: null,
      });
      waitUntil(
        runEvalGenerationJob({
          cacheKV: context.cacheKV,
          db: context.db,
          publicImagesBucket: context.publicImagesBucket,
          type: "content",
          fixture,
          jobId,
        }),
      );

      return {
        jobId,
        status: "pending",
        type: "content",
        fixtureId: fixture.id,
      };
    }

    const fixture = strategyFixtures.find(
      (item) => item.id === input.fixtureId,
    );
    if (!fixture) {
      throw new ORPCError("NOT_FOUND", { message: "Fixture not found" });
    }
    const jobId = crypto.randomUUID();
    await putEvalGenerationStatus(context.cacheKV, {
      jobId,
      status: "pending",
      type: "strategy",
      fixtureId: fixture.id,
      output: null,
      generatedAt: null,
      outputFileName: null,
      stepsJson: null,
      stepsFileName: null,
      durationMs: null,
      error: null,
    });
    waitUntil(
      runEvalGenerationJob({
        cacheKV: context.cacheKV,
        db: context.db,
        publicImagesBucket: context.publicImagesBucket,
        type: "strategy",
        fixture,
        jobId,
      }),
    );

    return {
      jobId,
      status: "pending",
      type: "strategy",
      fixtureId: fixture.id,
    };
  });

const getEvalGenerationStatus = protectedBase
  .route({ method: "GET", path: "/eval/generate/status" })
  .input(
    type({
      jobId: "string",
    }),
  )
  .output(
    type({
      jobId: "string",
      status: "'pending'|'completed'|'failed'|'not_found'",
      type: "'content'|'strategy'|null",
      fixtureId: "string|null",
      output: "string|null",
      generatedAt: "string|null",
      outputFileName: "string|null",
      stepsJson: "string|null",
      stepsFileName: "string|null",
      durationMs: "number|null",
      error: "string|null",
    }),
  )
  .handler(async ({ context, input }) => {
    assertFluidpostsEmail(context.user.email);

    const payload = await context.cacheKV.get<EvalGenerationStatusValue>(
      getEvalGenerationKey(input.jobId),
      "json",
    );
    console.log("payload", payload);

    if (!payload) {
      return {
        jobId: input.jobId,
        status: "not_found",
        type: null,
        fixtureId: null,
        output: null,
        generatedAt: null,
        outputFileName: null,
        stepsJson: null,
        stepsFileName: null,
        durationMs: null,
        error: null,
      };
    }

    return payload;
  });

const listEvalFixtureScores = protectedBase
  .route({ method: "GET", path: "/eval/scores" })
  .input(
    type({
      type: "'content'|'strategy'",
      fixtureId: "string",
    }),
  )
  .output(
    type({
      scores: type({
        timestamp: "string",
        overallScore: "number",
        durationMs: "number",
        filePath: "string",
      }).array(),
    }),
  )
  .handler(({ context, input }) => {
    assertFluidpostsEmail(context.user.email);
    if (!input.fixtureId.trim()) {
      return { scores: [] };
    }

    return { scores: [] };
  });

const scoreEvalOutput = protectedBase
  .route({ method: "POST", path: "/eval/score" })
  .input(
    type({
      type: "'content'|'strategy'",
      fixtureId: "string",
      output: "string",
      durationMs: "number",
    }),
  )
  .output(
    type({
      fixtureId: "string",
      overallScore: "number",
      dimensions: type({
        name: "string",
        score: "number",
        weight: "number",
        feedback: "string",
      }).array(),
      pairwiseVsReference: type({
        winner: "'current'|'reference'|'tie'",
        reasoning: "string",
      }).or("null"),
      scoreTimestamp: "string",
      scoreFileName: "string",
      scoreJson: "string",
    }),
  )
  .handler(async ({ context, input }) => {
    assertFluidpostsEmail(context.user.email);

    if (input.type === "content") {
      const fixture = contentFixtures.find(
        (item) => item.id === input.fixtureId,
      );
      if (!fixture) {
        throw new ORPCError("NOT_FOUND", { message: "Fixture not found" });
      }

      const result = await scoreContent({
        fixture,
        output: input.output,
        durationMs: input.durationMs,
      });

      return {
        fixtureId: result.fixtureId,
        overallScore: result.overallScore,
        dimensions: result.dimensions,
        pairwiseVsReference: result.pairwiseVsReference,
        scoreTimestamp: result.timestamp,
        scoreFileName: `${result.fixtureId}-${new Date(result.timestamp).toISOString().replace(/[:.]/g, "-")}-score.json`,
        scoreJson: JSON.stringify(result, null, 2),
      };
    }

    const fixture = strategyFixtures.find(
      (item) => item.id === input.fixtureId,
    );
    if (!fixture) {
      throw new ORPCError("NOT_FOUND", { message: "Fixture not found" });
    }

    const result = await scoreStrategy({
      fixture,
      output: input.output,
      durationMs: input.durationMs,
    });

    return {
      fixtureId: result.fixtureId,
      overallScore: result.overallScore,
      dimensions: result.dimensions,
      pairwiseVsReference: result.pairwiseVsReference,
      scoreTimestamp: result.timestamp,
      scoreFileName: `${result.fixtureId}-${new Date(result.timestamp).toISOString().replace(/[:.]/g, "-")}-score.json`,
      scoreJson: JSON.stringify(result, null, 2),
    };
  });

export default protectedBase.prefix("/admin").router({
  triggerOnboardingTask,
  triggerStrategySuggestionsTask,
  triggerStrategyPhaseGenerationTask,
  listEvalFixtures,
  generateEvalOutput,
  getEvalGenerationStatus,
  listEvalFixtureScores,
  scoreEvalOutput,
});
