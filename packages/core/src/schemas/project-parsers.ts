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

export const businessBackgroundSchema = type({
  version: "'v1'",
  businessOverview: type("string")
    .atLeastLength(1)
    .describe(
      "Start with org type + primary offering(s); state ALL the business Unique Value Proposition comprehensively; no fluff.",
    )
    .configure({
      message: () => "Business Overview is required",
    }),
  targetAudience: type("string")
    .atLeastLength(1)
    .describe(
      "Format: B2B - Roles/Titles; Industries; Company size; Geo. B2C - Personas; Demographics/Age; Needs/Use cases; Geo. If both, include both separated by ' | '. Examples — B2B: 'Ops leaders; SaaS; 50-500 FTE; US/UK' | 'HR Directors; Healthcare; 200-1000 FTE; US/CA'. B2C: 'Parents of toddlers; Age 25-40; Childcare savings; US' | 'College students; Age 18-24; Budget laptops; UK'.",
    )
    .configure({
      message: () => "Target Audience is required",
    }),
  caseStudies: type({
    title: "string",
    description: "string",
  })
    .array()
    .describe("Case studies that demonstrate results or credibility."),
  competitorsWebsites: type({ url: "string.url" })
    .array()
    .describe("List of URLs of direct competitors. Leave blank if none."),
  industry: type("string")
    .atLeastLength(1)
    .describe(
      "Broad top-level category, e.g. 'Software', 'Healthcare', 'E-commerce'.",
    )
    .configure({
      message: () => "Industry is required",
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
  languageCode: type("string").describe(
    "2-letter language code that would encompass the language of the majority of the target audience. Default 'en' if not specified.",
  ),
});

export const imageSettingsSchema = type({
  version: "'v1'",
  styleReferences: type({
    uris: "string[]",
    "instructions?": "string",
  })
    .array()
    .describe(
      "Visual references that describe the desired style, composition, or mood.",
    ),
  brandLogos: type({
    uris: "string[]",
    "name?": "string",
    "instructions?": "string",
  })
    .array()
    .describe("Brand logos that should be used for the project."),
  imageInstructions: type("string").describe(
    "Additional guidance for how generated images should look (e.g., do/don'ts, brand rules).",
  ),
});

export const writingSettingsSchema = type({
  version: "'v1'",
  brandVoice: type("string")
    .atLeastLength(1)
    .describe(
      "Capture brand voice comprehensively: Tone (e.g., professional, casual, witty, authoritative, empathetic); Style (e.g., concise, storytelling, data-driven, conversational); Persona (e.g., expert advisor, friendly guide, industry leader, innovator); Voice attributes (e.g., formal/informal, technical/accessible, serious/playful). Include linguistic patterns if distinctive (e.g., 'uses contractions', 'avoids jargon', 'data-heavy with examples').",
    )
    .configure({
      message: () => "Brand Voice is required",
    }),
  customInstructions: type("string").describe(
    "Extra instructions to steer generated articles (e.g., formatting, calls to action, do/don'ts).",
  ),
  metadata: type({
    name: "string",
    description: "string",
  })
    .array()
    .describe("Named metadata presets used for content generation."),
});

export const publishingSettingsSchema = type({
  version: "'v1'",
  cadence: type({
    // "daily" => frequency is articles/day
    // "weekly" => frequency is articles/week
    // "monthly" => frequency is articles/month
    period: "'daily' | 'weekly' | 'monthly'",
    frequency: "number.integer >= 1",
    // Days that are eligible for publishing. Deselecting a day means we won't publish on that day.
    allowedDays: type(
      "'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'",
    ).array(),
  }),
  requireContentReview: "boolean",
  requireSuggestionReview: "boolean",
});

export const authorSettingsSchema = type({
  name: type("string").describe("The name of the author."),
  title: type("string").describe("The title of the author."),
  bio: type("string").describe("The bio of the author."),
  avatarUri: type("string").describe("The avatar URI of the author."),
  socialLinks: type({
    platform: "string",
    url: "string.url",
  })
    .array()
    .or(type.null)
    .describe("The social links of the author."),
});
