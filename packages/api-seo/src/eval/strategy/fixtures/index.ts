import type { StrategyFixture } from "../../types";

/**
 * 3 strategy fixtures covering different business types and strategy goals.
 *
 * Each fixture simulates a realistic site that needs an SEO strategy.
 * The `referenceOutput` starts null and should be populated with the
 * current best strategy output after an initial run you're satisfied with.
 */
export const strategyFixtures: StrategyFixture[] = [
  {
    id: "01-saas-market-entry",
    description:
      "New B2B SaaS entering a competitive market. Tests keyword research depth, content pillar logic, and realistic prioritization given low domain authority.",
    input: {
      instructions:
        "Generate 2 strategy suggestions for a new B2B SaaS entering the project management space. The site has no existing content and a domain authority of approximately 10. Budget allows for 8 articles per month. Focus on strategies that can show results within 3-6 months, targeting long-tail keywords first before going after head terms.",
      site: {
        name: "TaskPilot",
        websiteUrl: "https://taskpilot.app",
        businessBackground:
          "TaskPilot is a new project management tool for remote engineering teams (5-20 people). Launched 3 months ago. Key features: async standup automation, sprint planning with AI estimates, GitHub/GitLab integration. No blog content yet. Competing against Jira, Linear, Shortcut. Currently 200 monthly organic visitors from branded searches only. Based in Austin, TX. Funding: bootstrapped.",
        industry: "B2B SaaS / Project Management",
      },
    },
    referenceOutput: null,
  },

  {
    id: "02-local-service-expansion",
    description:
      "Established local service business expanding to nearby cities. Tests local SEO strategy, service area targeting, and Google Business Profile optimization recommendations.",
    input: {
      instructions:
        "Generate 2 strategy suggestions for a plumbing company that dominates their home city (Austin) but wants to expand to 3 nearby cities (Round Rock, Cedar Park, Georgetown). They have an existing blog with 30 articles but it has been neglected for 6 months. The site gets about 2,000 monthly organic visits, mostly from Austin-related queries. Focus on strategies that balance maintaining Austin rankings while expanding to new service areas.",
      site: {
        name: "Austin Pro Plumbing",
        websiteUrl: "https://austinproplumbing.com",
        businessBackground:
          "Austin Pro Plumbing has been operating for 12 years. 15 trucks, serves residential and commercial clients. Top 3 in Google Maps for 'plumber Austin' and related terms. Existing blog covers common plumbing topics but stopped publishing 6 months ago. Has Google Business Profile with 450+ reviews (4.8 stars). Wants to double service area without losing current rankings. Budget: can add 4-6 articles per month.",
        industry: "Local Services / Plumbing",
      },
    },
    referenceOutput: null,
  },

  {
    id: "03-ecommerce-content-refresh",
    description:
      "Mid-size ecommerce site with declining organic traffic. Tests content audit skills, decay identification, and refresh prioritization strategy.",
    input: {
      instructions:
        "Generate 2 strategy suggestions for an ecommerce site that has seen a 30% decline in organic traffic over the last 6 months. The site has 150+ blog posts and 500+ product pages. Many blog posts are 2-3 years old and have never been updated. The site used to rank well for buyer-intent keywords but has been overtaken by competitors who publish more frequently. Focus on strategies that prioritize quick wins from refreshing existing content while also building new topical authority in underserved areas.",
      site: {
        name: "GearHub",
        websiteUrl: "https://gearhub.com",
        businessBackground:
          "GearHub is a direct-to-consumer outdoor gear and equipment retailer. Founded 2019. Sells camping, hiking, climbing, and cycling gear. 500+ products, 150+ blog posts (buying guides, gear reviews, how-to articles). Domain authority approximately 45. Traffic declined from 80K to 55K monthly organic visits in the last 6 months after a Google core update. Strongest categories: camping gear and hiking boots. Weakest: cycling gear (new category, minimal content). Main competitors: REI, Backcountry, OutdoorGearLab. Budget: 8-12 articles per month.",
        industry: "Ecommerce / Outdoor Gear",
      },
    },
    referenceOutput: null,
  },
];
