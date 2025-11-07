import { type } from "arktype";
import { intentSchema } from "./content-parsers";

export const serpPositionSchema = type({
  position: "number",
  estimatedTrafficVolume: "number | null",
});

export const serpResultSchema = type({
  title: "string",
  url: "string",
  description: "string | null",
});

export const keywordSearchVolumeSchema = type({
  monthlyAverage: "number | null",
  monthlyBreakdown: type({
    year: "number | null",
    month: "number | null",
    searchVolume: "number | null",
  })
    .array()
    .or(type.null),
  percentageChange: type({
    monthly: "number | null",
    quarterly: "number | null",
    yearly: "number | null",
  }).or(type.null),
  approximateGenderDistribution: type({
    male: "number | null",
    female: "number | null",
  }).or(type.null),
  approximateAgeDistribution: type({
    "[string]": "number | null",
  }).or(type.null),
});

export const keywordCompetitionSchema = type({
  cpc: "number | null",
  competition: "number | null",
  competitionLevel: "'LOW' | 'MEDIUM' | 'HIGH' | null",
  lowTopOfPageBid: "number | null",
  highTopOfPageBid: "number | null",
});

export const keywordSerpInfoSchema = type({
  url: "string.url | null",
  itemTypes: "string[] | null",
  resultCount: "number | null",
});

export const backlinkInfoSchema = type({
  averageBacklinkCount: "number| null",
  averageDoFollowLinkCount: "number| null",
  averageReferringPageCount: "number| null",
  averageReferringDomainCount: "number| null",
  averageReferringMainDomainCount: "number| null",
  averagePageRank: "number| null",
  averageMainDomainRank: "number| null",
});

export const contentKeywordSchema = type({
  keyword: "string",
  keywordDifficulty: "number | null",
  mainIntent: intentSchema.or(type.null),
  searchVolume: keywordSearchVolumeSchema,
  competition: keywordCompetitionSchema,
  serpInfo: keywordSerpInfoSchema.or(type.null),
  backlinkInfo: backlinkInfoSchema.or(type.null),
});
