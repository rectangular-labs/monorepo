import { type } from "arktype";

export const serpPositionSchema = type({
  position: "number",
  estimatedTrafficVolume: "number | null",
});

export const serpResultSchema = type({
  title: "string",
  url: "string",
  description: "string | null",
});

const ageDistributionSchema = type({
  "[string]": "number | null",
});
const genderDistributionSchema = type({
  male: "number | null",
  female: "number | null",
});

const pageRankSchema = type({
  position1_10: "number | null",
  position11_20: "number | null",
  position21_30: "number | null",
  position31_40: "number | null",
  position41_50: "number | null",
  rankedKeywords: "number | null",
  estimatedTrafficVolume: "number | null",
  approximateGenderDistributionPercentage: genderDistributionSchema.or(
    type.null,
  ),
  approximateAgeDistributionPercentage: ageDistributionSchema.or(type.null),
});

export const keywordIntentSchema = type(
  "'transactional'|'informational'|'navigational'|'commercial'",
);
export const serpTrafficSchema = type({
  url: "string.url",
  organic: pageRankSchema.or(type.null),
  paid: pageRankSchema.or(type.null),
  featured_snippet: pageRankSchema.or(type.null),
  local_pack: pageRankSchema.or(type.null),
});

const keywordSearchVolumeSchema = type({
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
  approximateGenderDistributionPercentage: genderDistributionSchema.or(
    type.null,
  ),
  approximateAgeDistributionPercentage: ageDistributionSchema.or(type.null),
});

const keywordCompetitionSchema = type({
  cpc: "number | null",
  competition: "number | null",
  competitionLevel: "'LOW' | 'MEDIUM' | 'HIGH' | null",
  lowTopOfPageBid: "number | null",
  highTopOfPageBid: "number | null",
});

const keywordSerpInfoSchema = type({
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
  mainIntent: keywordIntentSchema.or(type.null),
  searchVolume: keywordSearchVolumeSchema,
  competition: keywordCompetitionSchema,
  serpInfo: keywordSerpInfoSchema.or(type.null),
  backlinkInfo: backlinkInfoSchema.or(type.null),
});

/**
 * Types of google element that we care about from DataForSEO
 * organic:
 * * title
 * * description
 * * pre snippet
 * * Extended snippet
 * * url
 *
 * paid:
 * * title
 * * description
 * * url
 *
 * related_searches:
 * * items
 *
 * people_also_search:
 * * items
 *
 * local_pack:
 * * title
 * * description
 * * rating
 *
 * hotels_pack:
 * * title
 * in an array:
 * * title
 * * description
 * * rating
 * * price
 * * url
 * * is_paid
 *
 * featured_snippet:
 * * title
 * * featured_title
 * * domain/url
 * * table
 *
 * top_stories:
 * * title
 * in an array:
 * * source
 * * date_update
 * * image_url
 * * url
 *
 * twitter (array of):
 * * tweet
 * * url
 *
 * images:
 * * title
 * in an array:
 * * image_url
 * * url (image originating page)
 * * alt
 *
 * video:
 * in an array:
 * * title
 * * source
 * * url
 *
 * people_also_ask:
 * in an array:
 * * question
 * * answer
 * * url
 * TODO: handle aio people also ask
 *
 * shopping (this is all sponsored):
 * in an array:
 * * title
 * * description
 * * source
 * * rating
 * * price
 * * url
 *
 * popular_products:
 * in an array:
 * * title
 * * description
 * * seller
 * * rating
 * * price
 * * image_url
 *
 * mention_carousel:
 * * title
 * in an array:
 * * title
 * * price
 * * rating
 * * mentioned_id:
 *     * title
 *     * url
 *
 * recipes:
 * in an array:
 * * title
 * * source
 * * description
 * * url
 * * time
 * * rating
 *
 * questions_and_answers:
 * in an array:
 * * question_text
 * * answer_text
 * * url
 * * source
 * * votes
 *
 * perspectives:
 * in an array:
 * * title
 * * description
 * * url
 * * source
 * * timestamp
 *
 * discussions_and_forums:
 * in an array:
 * * title
 * * description
 * * url
 * * source
 * * timestamp
 * * posts_count
 *
 * compare_sites:
 * in an array:
 * * title
 * * url
 * * source
 * * image_url
 *
 * ai_overview:
 * * references:
 *   * in an array:
 *     * url
 *     * title
 *     * text
 *     * source
 * in an array:
 * * title
 * * markdown/text
 *
 * commercial_units (ad spots for travel and tourist attractions):
 * in an array:
 * * title
 * * source
 * * url
 * * rating
 * * price
 *
 * found_on_web
 * * title
 * in an array:
 * * title
 * * subtitle
 * * image.image_url
 *
 * product_consideration
 *
 *
 * Things dropped:
 * * short_videos
 * * multi_carousel
 * * carousel
 * * visual_stories
 * * app
 * * courses
 * * explore_brands
 * * refine_products
 * * currency_box
 * * math_solver
 * * local_services
 * * stocks_box
 * * answer_box
 * * find_results_on
 * * podcasts
 * * scholarly_articles
 * * top_sights
 * * events
 * * jobs
 * * google_posts
 * * google_reviews
 * * google_hotels
 * * google_flights
 * * map
 * * knowledge_graph
 */
