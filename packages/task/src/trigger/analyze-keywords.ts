import { fetchRankedKeywordsForSite } from "@rectangular-labs/dataforseo";
import { client } from "@rectangular-labs/dataforseo/client";
import { createDb, type schema } from "@rectangular-labs/db";
import {
  getSeoProjectById,
  updateSeoProject,
  upsertSearchKeyword,
} from "@rectangular-labs/db/operations";
import {
  analyzeKeywordsTaskInputSchema,
  type analyzeKeywordsTaskOutputSchema,
  COUNTRY_CODE_MAP,
} from "@rectangular-labs/db/parsers";
import { AbortTaskRunError, schemaTask } from "@trigger.dev/sdk";
import { taskEnv } from "../env.js";
import { processCluster } from "../lib/process-cluster.js";
import { setTaskMetadata } from "../lib/task-metadata.js";

export const analyzeKeywordsTask: ReturnType<
  typeof schemaTask<
    "analyze-keywords",
    typeof analyzeKeywordsTaskInputSchema,
    typeof analyzeKeywordsTaskOutputSchema.infer
  >
> = schemaTask({
  id: "analyze-keywords",
  maxDuration: 300,
  machine: "micro",
  schema: analyzeKeywordsTaskInputSchema,
  run: async (payload) => {
    setTaskMetadata({
      progress: 0,
      statusMessage: "Analyzing keywords...",
    });
    client.setConfig({
      auth: () =>
        `${taskEnv().DATAFORSEO_USERNAME}:${taskEnv().DATAFORSEO_PASSWORD}`,
    });
    const db = createDb();
    const improvementContentIds: string[] = [];
    const newContentContentIds: string[] = [];
    const doNothingContentIds: string[] = [];

    const projectResult = await getSeoProjectById(db, payload.projectId);
    if (!projectResult.ok || !projectResult.value) {
      throw new AbortTaskRunError(`Project not found for ${payload.projectId}`);
    }
    const { value: project } = projectResult;
    if (!project.websiteInfo) {
      throw new AbortTaskRunError(
        `Website info not found for ${payload.projectId}`,
      );
    }

    // check if we need to fetch the data from project
    if (
      !project.serpSnapshot ||
      new Date(project.serpSnapshot.nextEarliestFetchAt).getTime() < Date.now()
    ) {
      const locationName =
        COUNTRY_CODE_MAP[project.websiteInfo?.targetCountryCode ?? "US"] ??
        "United States";
      /**
       * This fetches for keywords that the site already rank for in positions 1-30
       */
      const result = await fetchRankedKeywordsForSite({
        hostname: new URL(project.websiteUrl).hostname,
        positionFrom: 1,
        positionTo: 35,
        locationName,
        languageCode: project.websiteInfo?.languageCode ?? "en",
        limit: 1000,
      });
      if (!result.ok) {
        throw result.error;
      }

      await updateSeoProject(db, {
        id: project.id,
        serpSnapshot: {
          nextEarliestFetchAt: result.value.nextEarliestUpdate,
          provider: result.value.provider,
          current: {
            organic: result.value.siteDetails.organic,
            dateFetchedAt: new Date().toISOString(),
          },
          previous: project.serpSnapshot?.current ?? null,
        },
      });

      const upsertedKeywords = await upsertSearchKeyword(
        db,
        result.value.keywords.map((keyword) => ({
          normalizedPhrase: keyword.keyword.toLowerCase().trim(),
          intent: keyword.mainIntent ?? ("informational" as const),
          keywordDifficulty: keyword.keywordDifficulty,
          location: locationName,
          searchVolume: keyword.searchVolume,
          backlinkInfo: keyword.backlinkInfo,
          cpcUsdCents: Math.round((keyword.cpc ?? 0) * 100),
          serpFeatures: keyword.serpFeatures,
        })),
      );
      if (!upsertedKeywords.ok) {
        throw upsertedKeywords.error;
      }

      /**
       * This is how we figure out content to be improved.:
       * * Each page url forms the basis of a content cluster so we create a map of page url -> array of keywords
       * * We process each cluster deciding whether to improve the page or leave it as it is
       */
      const keywordsToImproveByPage = result.value.keywords.reduce(
        (acc, keyword) => {
          const pageUrl = keyword.serpDetails?.url;
          if (!pageUrl) {
            return acc;
          }
          const upsertedKeyword = upsertedKeywords.value.find(
            (kw) =>
              kw.normalizedPhrase === keyword.keyword.toLowerCase().trim(),
          );
          if (!upsertedKeyword) {
            return acc;
          }
          acc[pageUrl] = [
            ...(acc[pageUrl] || []),
            {
              ...upsertedKeyword,
              currentPosition: keyword.serpDetails?.position ?? null,
              estimatedSearchVolume:
                keyword.serpDetails?.estimatedTrafficVolume ?? null,
            },
          ];
          return acc;
        },
        {} as Record<
          string,
          (typeof schema.seoSearchKeywordSelectSchema.infer & {
            currentPosition: number | null;
            estimatedSearchVolume: number | null;
          })[]
        >,
      );

      for (const [url, keywords] of Object.entries(keywordsToImproveByPage)) {
        console.log(
          `Processing cluster for ${url} with ${keywords.length} keywords`,
        );
        const content = await processCluster({
          db,
          project,
          pageUrl: url,
          keywords,
        });
        if (content && content.campaignType === "improvement") {
          improvementContentIds.push(content.id);
        } else if (content && content.campaignType === "do-nothing") {
          doNothingContentIds.push(content.id);
        }
      }
    }

    return {
      type: "analyze-keywords",
      improvementContentIds,
      newContentContentIds,
      doNothingContentIds,
    };
  },
});
