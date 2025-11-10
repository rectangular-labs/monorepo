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
 * Types of google element that we dropped from DataForSEO
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

const imageSchema = type({
  alt: "string | null",
  url: "string.url | null",
  imageUrl: "string.url | null",
});

const ratingSchema = type({
  value: "number | null",
  max: "number | null",
  votes: "number | null",
});

const priceSchema = type({
  current: "number | null",
  regular: "number | null",
  max: "number | null",
  displayPrice: "string | null",
  currency: "string | null",
});

const tableSchema = type({
  headers: "string[]",
  rows: "string[][] ",
});

export const serpTypes = type(
  "'organic'|'paid'|'featured_snippet'|'local_pack'|'top_stories'|'people_also_ask'|'images'|'video'|'shopping'|'popular_products'|'recipes'|'perspectives'|'discussions_and_forums'|'related_searches'|'compare_sites'|'ai_overview'|'commercial_units'|'found_on_web'|'product_consideration'|'hotel_pack'|'twitter'|'mention_carousel'|'people_also_search'|'questions_and_answers'",
);

export const organicSearchItemSchema = type({
  type: type("'organic'"),
  absolutePosition: "number | null",
  title: "string | null",
  description: "string | null",
  url: "string.url | null",
  preSnippet: "string | null",
  extendedSnippet: "string | null",
  rating: ratingSchema.or(type.null),
  price: priceSchema.or(type.null),
  images: imageSchema.array().default(() => []),
});

export const paidSearchItemSchema = type({
  type: type("'paid'"),
  absolutePosition: "number | null",
  title: "string | null",
  description: "string | null",
  url: "string.url | null",
});

export const featuredSnippetSearchItemSchema = type({
  type: type("'featured_snippet'"),
  absolutePosition: "number | null",
  featuredTitle: "string | null",
  description: "string | null",
  table: tableSchema.or(type.null),
  title: "string | null",
  url: "string.url | null",
  images: imageSchema.array().default(() => []),
  timestamp: "Date | null",
});

export const relatedSearchesSearchItemSchema = type({
  type: type("'related_searches'"),
  absolutePosition: "number | null",
  items: type("string")
    .array()
    .default(() => []),
});

export const peopleAlsoSearchSearchItemSchema = type({
  type: type("'people_also_search'"),
  absolutePosition: "number | null",
  items: type("string")
    .array()
    .default(() => []),
});

export const localPackSearchItemSchema = type({
  type: type("'local_pack'"),
  absolutePosition: "number | null",
  title: "string | null",
  description: "string | null",
  url: "string.url | null",
  rating: ratingSchema.or(type.null),
  isPaid: "boolean | null",
});

export const hotelPackSearchItemSchema = type({
  type: type("'hotel_pack'"),
  absolutePosition: "number | null",
  title: "string | null",
  hotels: type({
    title: "string | null",
    description: "string | null",
    url: "string.url | null",
    isPaid: "boolean | null",
    rating: ratingSchema.or(type.null),
    price: priceSchema.or(type.null),
  })
    .array()
    .default(() => []),
});

export const topStoriesSearchItemSchema = type({
  type: type("'top_stories'"),
  absolutePosition: "number | null",
  title: "string | null",
  stories: type({
    title: "string | null",
    source: "string | null",
    timestamp: "Date | null",
    url: "string.url | null",
    imageUrl: "string.url | null",
  })
    .array()
    .default(() => []),
});

export const twitterSearchItemSchema = type({
  type: type("'twitter'"),
  absolutePosition: "number | null",
  tweets: type({
    tweet: "string | null",
    timestamp: "Date | null",
    url: "string.url | null",
  })
    .array()
    .default(() => []),
});

export const imagesSearchItemSchema = type({
  type: type("'images'"),
  absolutePosition: "number | null",
  title: "string | null",
  images: imageSchema.array().default(() => []),
});

export const videoSearchItemSchema = type({
  type: type("'video'"),
  absolutePosition: "number | null",
  videos: type({
    title: "string | null",
    source: "string | null",
    timestamp: "Date | null",
    url: "string.url | null",
  })
    .array()
    .default(() => []),
});

export const peopleAlsoAskSearchItemSchema = type({
  type: type("'people_also_ask'"),
  absolutePosition: "number | null",
  items: type({
    question: "string | null",
    answer: "string | null",
    url: "string.url | null",
    image: imageSchema.or(type.null),
    timestamp: "Date | null",
    table: tableSchema.or(type.null),
  })
    .array()
    .default(() => []),
});

export const shoppingSearchItemSchema = type({
  type: type("'shopping'"),
  absolutePosition: "number | null",
  title: "string | null",
  items: type({
    title: "string | null",
    description: "string | null",
    source: "string | null",
    rating: ratingSchema.or(type.null),
    price: priceSchema.or(type.null),
    url: "string.url | null",
    isPaid: "true",
  })
    .array()
    .default(() => []),
});

export const popularProductsSearchItemSchema = type({
  type: type("'popular_products'"),
  absolutePosition: "number | null",
  title: "string | null",
  products: type({
    title: "string | null",
    description: "string | null",
    seller: "string | null",
    rating: ratingSchema.or(type.null),
    price: priceSchema.or(type.null),
    imageUrl: "string.url | null",
  })
    .array()
    .default(() => []),
});

export const mentionCarouselSearchItemSchema = type({
  type: type("'mention_carousel'"),
  absolutePosition: "number | null",
  title: "string | null",
  mentions: type({
    title: "string | null",
    rating: ratingSchema.or(type.null),
    price: priceSchema.or(type.null),
    imageUrl: "string.url | null",
    mentioningSites: type({
      title: "string | null",
      description: "string | null",
      url: "string.url | null",
    })
      .array()
      .default(() => []),
  })
    .array()
    .default(() => []),
});

export const recipesSearchItemSchema = type({
  type: type("'recipes'"),
  absolutePosition: "number | null",
  recipes: type({
    title: "string | null",
    description: "string | null",
    source: "string | null",
    url: "string.url | null",
    time: "string | null",
    rating: ratingSchema.or(type.null),
  })
    .array()
    .default(() => []),
});

export const perspectivesSearchItemSchema = type({
  type: type("'perspectives'"),
  absolutePosition: "number | null",
  title: "string | null",
  perspectives: type({
    title: "string | null",
    description: "string | null",
    url: "string.url | null",
    source: "string | null",
    timestamp: "Date | null",
  })
    .array()
    .default(() => []),
});

export const discussionsAndForumsSearchItemSchema = type({
  type: type("'discussions_and_forums'"),
  absolutePosition: "number | null",
  title: "string | null",
  discussions: type({
    title: "string | null",
    description: "string | null",
    url: "string.url | null",
    source: "string | null",
    timestamp: "Date | null",
    postsCount: "number | null",
  })
    .array()
    .default(() => []),
});

export const questionsAndAnswersSearchItemSchema = type({
  type: type("'questions_and_answers'"),
  absolutePosition: "number | null",
  questions: type({
    question: "string | null",
    answer: "string | null",
    url: "string.url | null",
    source: "string | null",
    votes: "number | null",
  })
    .array()
    .default(() => []),
});

export const compareSitesSearchItemSchema = type({
  type: type("'compare_sites'"),
  absolutePosition: "number | null",
  title: "string | null",
  sites: type({
    title: "string | null",
    url: "string.url | null",
    source: "string | null",
    imageUrl: "string.url | null",
  })
    .array()
    .default(() => []),
});

export const productConsiderationItemSchema = type({
  type: type("'product_consideration'"),
  absolutePosition: "number | null",
  title: "string | null",
  considerations: type({
    title: "string | null",
    description: "string | null",
    considerationCategory: "string | null",
    articleTitle: "string | null",
    articleUrl: "string.url | null",
    articleTimestamp: "Date | null",
    relatedSearches: "string[] | null",
  })
    .array()
    .default(() => []),
});

export const commercialUnitsSearchItemSchema = type({
  type: type("'commercial_units'"),
  absolutePosition: "number | null",
  title: "string | null",
  commercialUnits: type({
    title: "string | null",
    source: "string | null",
    url: "string.url | null",
    rating: ratingSchema.or(type.null),
    price: priceSchema.or(type.null),
  })
    .array()
    .default(() => []),
});

export const foundOnWebSearchItemSchema = type({
  type: type("'found_on_web'"),
  absolutePosition: "number | null",
  title: "string | null",
  items: type({
    title: "string | null",
    subtitle: "string | null",
    image: imageSchema.or(type.null),
  })
    .array()
    .default(() => []),
});

export const aiOverviewSearchItemSchema = type({
  type: type("'ai_overview'"),
  absolutePosition: "number | null",
  references: type({
    url: "string.url | null",
    title: "string | null",
    text: "string | null",
    source: "string | null",
  })
    .array()
    .or(type.null),
  items: type({
    title: "string | null",
    text: "string | null",
  })
    .array()
    .or(type.null),
});

export const searchItemSchema = organicSearchItemSchema
  .or(paidSearchItemSchema)
  .or(featuredSnippetSearchItemSchema)
  .or(localPackSearchItemSchema)
  .or(topStoriesSearchItemSchema)
  .or(peopleAlsoAskSearchItemSchema)
  .or(imagesSearchItemSchema)
  .or(videoSearchItemSchema)
  .or(shoppingSearchItemSchema)
  .or(popularProductsSearchItemSchema)
  .or(recipesSearchItemSchema)
  .or(perspectivesSearchItemSchema)
  .or(discussionsAndForumsSearchItemSchema)
  .or(relatedSearchesSearchItemSchema)
  .or(compareSitesSearchItemSchema)
  .or(aiOverviewSearchItemSchema)
  .or(commercialUnitsSearchItemSchema)
  .or(foundOnWebSearchItemSchema)
  .or(productConsiderationItemSchema)
  .or(hotelPackSearchItemSchema)
  .or(twitterSearchItemSchema)
  .or(mentionCarouselSearchItemSchema)
  .or(peopleAlsoSearchSearchItemSchema)
  .or(questionsAndAnswersSearchItemSchema);
