import type { businessBackgroundSchema } from "@rectangular-labs/core/schemas/project-parsers";

export function formatBusinessBackground(
  background: typeof businessBackgroundSchema.infer | null,
) {
  if (!background) {
    return "";
  }
  return `- Business Overview: ${background.businessOverview}
- Target Audience: ${background.targetAudience}
- Industry: ${background.industry}
- Case Studies: ${
    background.caseStudies.length === 0
      ? "None Present"
      : `${background.caseStudies.length} present${background.caseStudies
          .map(
            (caseStudy, index) =>
              `\n    - ${index + 1}. Title: ${caseStudy.title}`,
          )
          .join("")}`
  }
- Competitor websites: ${background.competitorsWebsites.length === 0 ? "None Present" : `${background.competitorsWebsites.map((website, index) => `\n    - ${index + 1}. ${website}`).join("")}`}
`;
}
