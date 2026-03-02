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

    .configure({
      message: () => "Business Overview is required",
    }),
  targetAudience: type("string")
    .atLeastLength(1)

    .configure({
      message: () => "Target Audience is required",
    }),
  caseStudies: type({
    title: "string",
    description: "string",
  }).array(),
  // TODO: re-enforce .url when ArkType fixes toJsonSchema for url https://github.com/arktypeio/arktype/issues/1475
  competitorsWebsites: type({ url: "string.url" }).array(),
  industry: type("string")
    .atLeastLength(1)
    .configure({
      message: () => "Industry is required",
    }),
  targetCountryCode: type(
    `'${Object.keys(COUNTRY_CODE_MAP)
      .map((key) => key)
      .join("'|'")}'`,
  ).configure({
    message: () => "Country Code is required",
  }),
  targetCity: type("string"),
  languageCode: type("string"),
});
export const businessBackgroundJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "businessOverview",
    "targetAudience",
    "caseStudies",
    "competitorsWebsites",
    "industry",
    "targetCountryCode",
    "targetCity",
    "languageCode",
  ] satisfies string[],
  properties: {
    businessOverview: {
      type: "string",
      minLength: 1,
      description:
        "Start with org type + primary offering(s); state ALL the business Unique Value Proposition comprehensively; no fluff.",
    },
    targetAudience: {
      type: "string",
      minLength: 1,
      description:
        "Format: B2B - Roles/Titles; Industries; Company size; Geo. B2C - Personas; Demographics/Age; Needs/Use cases; Geo. If both, include both separated by ' | '. Examples — B2B: 'Ops leaders; SaaS; 50-500 FTE; US/UK' | 'HR Directors; Healthcare; 200-1000 FTE; US/CA'. B2C: 'Parents of toddlers; Age 25-40; Childcare savings; US' | 'College students; Age 18-24; Budget laptops; UK'.",
    },
    caseStudies: {
      type: "array",
      description: "Case studies that demonstrate results or credibility.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description"] satisfies string[],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
        },
      },
    },
    competitorsWebsites: {
      type: "array",
      description: "List of URLs of direct competitors. Leave blank if none.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["url"] satisfies string[],
        properties: {
          url: { type: "string" },
        },
      },
    },
    industry: {
      type: "string",
      minLength: 1,
      description:
        "Broad top-level category, e.g. 'Software', 'Healthcare', 'E-commerce'.",
    },
    targetCountryCode: {
      type: "string",
      enum: Object.keys(COUNTRY_CODE_MAP),
      description:
        "2-letter country code that would contain the majority of the target audience. Default 'US' if not specified.",
    },
    targetCity: {
      type: "string",
      description:
        "City name that would contain the majority of the target audience . Default 'San Francisco' if not specified.",
    },
    languageCode: {
      type: "string",
      description:
        "2-letter language code that would encompass the language of the majority of the target audience. Default 'en' if not specified.",
    },
  },
} as const;

export const imageSettingsSchema = type({
  version: "'v1'",
  styleReferences: type({
    uris: "string[]",
    "instructions?": "string",
  }).array(),
  brandLogos: type({
    uris: "string[]",
    "name?": "string",
    "instructions?": "string",
  }).array(),
  imageInstructions: type("string"),
  stockImageProviders: type("'unsplash'|'pexels'|'pixabay'").array(),
});
export const imageSettingsJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "styleReferences",
    "brandLogos",
    "imageInstructions",
    "stockImageProviders",
  ] satisfies string[],
  properties: {
    styleReferences: {
      type: "array",
      description:
        "Visual references that describe the desired style, composition, or mood.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["uris"] satisfies string[],
        properties: {
          uris: {
            type: "array",
            items: { type: "string" },
          },
          instructions: { type: "string" },
        },
      },
    },
    brandLogos: {
      type: "array",
      description: "Brand logos that should be used for the project.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["uris"] satisfies string[],
        properties: {
          uris: {
            type: "array",
            items: { type: "string" },
          },
          name: { type: "string" },
          instructions: { type: "string" },
        },
      },
    },
    imageInstructions: {
      type: "string",
      description:
        "Additional guidance for how generated images should look (e.g., do/don'ts, brand rules).",
    },
    stockImageProviders: {
      type: "array",
      description:
        "Preferred stock image providers to search (in order) when looking up open-license images.",
      items: {
        type: "string",
        enum: ["unsplash", "pexels", "pixabay"] satisfies string[],
      },
    },
  },
} as const;

export const writingSettingsSchema = type({
  version: "'v1'",
  brandVoice: type("string")
    .atLeastLength(1)

    .configure({
      message: () => "Brand Voice is required",
    }),
  customInstructions: type("string"),
});

export const writingSettingsJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["brandVoice", "customInstructions"] satisfies string[],
  properties: {
    brandVoice: {
      type: "string",
      minLength: 1,
      description:
        "Capture brand voice comprehensively: Tone (e.g., professional, casual, witty, authoritative, empathetic); Style (e.g., concise, storytelling, data-driven, conversational); Persona (e.g., expert advisor, friendly guide, industry leader, innovator); Voice attributes (e.g., formal/informal, technical/accessible, serious/playful). Include linguistic patterns if distinctive (e.g., 'uses contractions', 'avoids jargon', 'data-heavy with examples').",
    },
    customInstructions: {
      type: "string",
      description:
        "Extra instructions to steer generated articles (e.g., formatting, calls to action, do/don'ts).",
    },
  },
} as const;

export const publishingSettingsSchema = type({
  version: "'v1'",
  requireContentReview: "boolean",
  requireSuggestionReview: "boolean",
  participateInLinkExchange: type("boolean").default(() => true),
});

export const publishingSettingsJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "version",
    "requireContentReview",
    "requireSuggestionReview",
    "participateInLinkExchange",
  ] satisfies string[],
  properties: {
    version: {
      type: "string",
      const: "v1",
    },
    requireContentReview: { type: "boolean" },
    requireSuggestionReview: { type: "boolean" },
    participateInLinkExchange: { type: "boolean" },
  },
} as const;

export const authorSettingsSchema = type({
  name: type("string"),
  title: type("string"),
  bio: type("string"),
  avatarUri: type("string"),
  socialLinks: type({
    platform: "string",
    url: "string.url",
  })
    .array()
    .or(type.null),
});

export const authorSettingsJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "title",
    "bio",
    "avatarUri",
    "socialLinks",
  ] satisfies string[],
  properties: {
    name: {
      type: "string",
      description: "The name of the author.",
    },
    title: {
      type: "string",
      description: "The title of the author.",
    },
    bio: {
      type: "string",
      description: "The bio of the author.",
    },
    avatarUri: {
      type: "string",
      description: "The avatar URI of the author.",
    },
    socialLinks: {
      anyOf: [
        {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["platform", "url"] satisfies string[],
            properties: {
              platform: { type: "string" },
              url: { type: "string", format: "uri" },
            },
          },
        },
        { type: "null" },
      ],
      description: "The social links of the author.",
    },
  },
} as const;
