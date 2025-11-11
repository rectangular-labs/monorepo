import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input:
    "https://raw.githubusercontent.com/dataforseo/OpenApiDocumentation/refs/heads/master/openapi_specification.yaml",
  output: "./src",
  parser: {
    filters: {
      deprecated: false,
      operations: {
        include: [
          "GET /v3/dataforseo_labs/status",
          "POST /v3/serp/google/organic/live/regular",
          "POST /v3/serp/google/organic/live/advanced",
          "POST /v3/dataforseo_labs/google/keyword_suggestions/live",
          "POST /v3/dataforseo_labs/google/keyword_overview/live",
          "POST /v3/dataforseo_labs/google/ranked_keywords/live",
          "POST /v3/dataforseo_labs/google/relevant_pages/live",
        ],
      },
    },
  },
});
