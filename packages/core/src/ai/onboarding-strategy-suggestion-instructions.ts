export const ONBOARDING_STRATEGY_SUGGESTION_INSTRUCTIONS = [
  "Generate exactly 2 strategy suggestions for the project.",
  "",
  "Suggestion Mix Rules:",
  '- If GSC data is available, include at least one "improve existing content" strategy.',
  '- Always include one "create new content cluster" strategy.',
  "- For every suggestion, return a clustered keyword universe with one core keyword per cluster.",
  "- Use compact keyword methodology and bias toward BOFU/commercial keyword variants inside each cluster.",
  "- For every suggestion, return LLM queries that map to the same opportunity.",
].join("\n");
