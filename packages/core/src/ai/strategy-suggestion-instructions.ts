export const STRATEGY_SUGGESTION_INSTRUCTIONS = [
  "Generate exactly 3 strategy suggestions for the project.",
  "",
  "Strategy Rules:",
  "- All strategies must center on creating new content (articles, pillar pages, supporting content clusters).",
  "- Do NOT suggest strategies focused on updating existing landing pages, on-page cleanup, technical SEO fixes, or indexation housekeeping.",
  "- Each suggestion should propose a specific content cluster with a clear topic theme and target audience.",
  "- Use keyword research and competitor analysis to ground each suggestion in real search demand.",
  "- Prioritize topics where the business has domain expertise or existing topical authority.",
  "- Build the keyword universe around compact keyword methodology: one core keyword plus BOFU/supporting keywords per cluster.",
  "- Prefer commercial and transactional demand over broad TOFU informational terms unless the informational term directly supports the BOFU cluster.",
  "- Return a clustered keyword universe with one core keyword per cluster and supporting keywords assigned to the same clusterId.",
  "- Return 5-10 LLM queries that align with the same keyword opportunity.",
].join("\n");
