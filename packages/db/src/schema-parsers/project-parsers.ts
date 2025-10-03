import { type } from "arktype";

export const COUNTRY_CODE_MAP: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  JP: "Japan",
  CN: "China",
  IN: "India",
  BR: "Brazil",
  AU: "Australia",
  RU: "Russia",
  IT: "Italy",
  ES: "Spain",
  KR: "South Korea",
  NL: "Netherlands",
  CH: "Switzerland",
  SE: "Sweden",
  IE: "Ireland",
  SG: "Singapore",
  IL: "Israel",
  SA: "Saudi Arabia",
  AE: "United Arab Emirates",
  ZA: "South Africa",
};

export const seoWebsiteInfoSchema = type({
  version: "'v1'",
  businessOverview: type("string")
    .atLeastLength(1)
    .describe(
      "Start with org type + primary offering(s); state ALL the business Unique Value Proposition comprehensively; no fluff.",
    )
    .configure({
      message: () => "Business Overview is required",
    }),
  idealCustomer: type("string")
    .atLeastLength(1)
    .describe(
      "Format: B2B - Roles/Titles; Industries; Company size; Geo. B2C - Personas; Demographics/Age; Needs/Use cases; Geo. If both, include both separated by ' | '. Examples — B2B: 'Ops leaders; SaaS; 50-500 FTE; US/UK' | 'HR Directors; Healthcare; 200-1000 FTE; US/CA'. B2C: 'Parents of toddlers; Age 25-40; Childcare savings; US' | 'College students; Age 18-24; Budget laptops; UK'.",
    )
    .configure({
      message: () => "Ideal Customer is required",
    }),
  serviceRegion: type("string")
    .atLeastLength(1)
    .describe(
      "Canonical regions. Prefer 'Global', regions like 'EU', 'Asia', 'Africa', or country list separated by ';'. For local, use 'City, ST' or 'Metro, ST'.",
    )
    .configure({
      message: () => "Service Region is required",
    }),
  targetCountryCode: type(
    `'${Object.keys(COUNTRY_CODE_MAP)
      .map((key) => key)
      .join("'|'")}'`,
  )
    .describe(
      "2-letter country code that would contain the majority of the target audience. Default 'US' if not specified.",
    )
    .configure({
      message: () => "Country Code is required",
    }),
  targetCity: type("string").describe(
    "City name that would contain the majority of the target audience . Default 'San Francisco' if not specified.",
  ),
  industry: type("string")
    .atLeastLength(1)
    .describe(
      "Broad top-level category, e.g. 'Software', 'Healthcare', 'E-commerce'.",
    )
    .configure({
      message: () => "Industry is required",
    }),
  languageCode: type("string").describe(
    "2-letter language code that would encompass the language of the majority of the target audience. Default 'en' if not specified.",
  ),
  competitorsWebsites: type({ url: "string.url" })
    .array()
    .describe("List of URLs of direct competitors. Leave blank if none."),
});

export const seoSerpTrafficSchema = type({
  position1_10: type("number"),
  position11_20: type("number"),
  position21_30: type("number"),
  estimatedTrafficVolume: type("number"),
});

export const seoSerpSnapshotSchema = type({
  nextEarliestFetchAt: type("string.date"),
  provider: type("'dataforseo'"),
  current: type({
    organic: seoSerpTrafficSchema,
    dateFetchedAt: type("string"),
  }),
  previous: type({
    organic: seoSerpTrafficSchema,
    dateFetchedAt: type("string"),
  }).or(type.null),
});
