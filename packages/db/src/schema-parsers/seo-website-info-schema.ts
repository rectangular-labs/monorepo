import { type } from "arktype";

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
  targetCountryCode: type("string")
    .atLeastLength(1)
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
});
