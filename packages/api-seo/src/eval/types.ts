/**
 * Shared types for the eval framework.
 *
 * This framework evaluates content writing and strategy generation quality
 * using a mix of deterministic scorers and LLM-as-a-judge (G-Eval pattern).
 *
 * Workflow:
 * 1. Load fixtures (golden test cases)
 * 2. Run the workflow (writer or strategy) against each fixture
 * 3. Score the output with deterministic + LLM-judged criteria
 * 4. Save timestamped results
 * 5. Compare against baseline (the current best output)
 */

import type { ArticleType } from "@rectangular-labs/core/schemas/content-parsers";

// ---------------------------------------------------------------------------
// Content eval types
// ---------------------------------------------------------------------------

interface ContentFixtureProject {
  name: string;
  websiteUrl: string;
  businessBackground: string;
  brandVoice: string;
  customInstructions: string;
}

interface ContentFixtureExpectations {
  minWordCount: number;
  maxWordCount: number;
}

export interface ContentFixture {
  /** Unique identifier, e.g. "01-best-of-list-project-mgmt" */
  id: string;
  /** Human description of what this fixture tests */
  description: string;
  /** Inputs that map to writer workflow context */
  input: {
    primaryKeyword: string;
    title: string;
    articleType: ArticleType;
    notes: string | null;
    outline: string | null;
    project: ContentFixtureProject;
  };
  /** Deterministic expectations */
  expectations: ContentFixtureExpectations;
  /**
   * The current best output for this fixture. This is the standard to beat.
   * Initially null -- populate after the first run you're happy with.
   */
  referenceOutput: string | null;
}

// ---------------------------------------------------------------------------
// Strategy eval types
// ---------------------------------------------------------------------------

export interface StrategyFixtureSite {
  name: string;
  websiteUrl: string;
  businessBackground: string;
  industry: string;
}

export interface StrategyFixture {
  /** Unique identifier, e.g. "01-saas-market-entry" */
  id: string;
  /** Human description of what this fixture tests */
  description: string;
  /** Inputs for the strategy suggestion workflow */
  input: {
    instructions: string;
    site: StrategyFixtureSite;
  };
  /**
   * The current best output for this fixture. This is the standard to beat.
   * Initially null -- populate after the first run you're happy with.
   */
  referenceOutput: string | null;
}

// ---------------------------------------------------------------------------
// Score types (shared)
// ---------------------------------------------------------------------------
export interface ScoreDimension {
  name: string;
  score: number; // 1-10
  weight: number; // 0-1, sums to 1
  feedback: string;
}

export interface EvalResult<TFixture extends ContentFixture | StrategyFixture> {
  fixtureId: string;
  timestamp: string;
  /** The raw output from the workflow */
  output: string;
  /** Individual dimension scores */
  dimensions: ScoreDimension[];
  /** Weighted overall score */
  overallScore: number;
  /** Pairwise comparison against reference (if reference exists) */
  pairwiseVsReference: {
    winner: "current" | "reference" | "tie";
    reasoning: string;
  } | null;
  /** Duration of the workflow run in ms */
  durationMs: number;
  /** The fixture used (for reproducibility) */
  fixture: TFixture;
}

export interface EvalRunSummary {
  runId: string;
  timestamp: string;
  type: "content" | "strategy";
  results: EvalResult<ContentFixture | StrategyFixture>[];
  averageScore: number;
  /** How this run compares to the baseline */
  baselineDelta: number | null;
}
