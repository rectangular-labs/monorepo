import { defineStepper } from "@stepperize/react";

export type Category =
  | "Technical"
  | "OnPage"
  | "Content"
  | "Authority"
  | "Tracking";

export type ScoredOption = {
  label: string;
  value: string;
  score: number; // 0 - 10
  insights?: {
    id: string;
    message: string;
    impactWeight: number;
    category: Category;
  }[];
};

export type Question = {
  id: string;
  label: string;
  category: Category;
  options: ScoredOption[];
};

export type QuizMeta = {
  questions: Question[];
};

export type ScoredAnswer = {
  questionId: string;
  value: string;
};

export type Qualifying = {
  name: string;
  email: string;
  websiteUrl: string;
  profile: "Local" | "Ecom" | "SaaS" | "Content" | "Other";
  desired: "Leads" | "Sales" | "Authority" | "Other";
  obstacle: "Unsure" | "BadAgency" | "NoTime" | "Budget";
  investedBefore: "Yes" | "No";
  notes?: string;
};

export type Insight = {
  id: string;
  message: string;
  impactWeight: number;
  category: Category;
};

type ChoiceStep = {
  id: Question["id"];
  title: string;
  description: string;
  section: Category;
  kind: "choice";
  question: Question;
};

type QualifyingInputType = "text" | "email" | "url" | "textarea" | "radio";

type QualifyingStepField = keyof Qualifying;

type QualifyingStepBase = {
  id: string;
  title: string;
  description: string;
  section: "About You";
  kind: "qualifying";
  field: QualifyingStepField;
  inputType: QualifyingInputType;
};

type QualifyingStepTextlike = QualifyingStepBase & {
  inputType: "text" | "email" | "url" | "textarea";
};

type QualifyingStepRadio = QualifyingStepBase & {
  inputType: "radio";
  options: {
    label: string;
    value: NonNullable<Qualifying[keyof Qualifying]>;
  }[];
};

export type StepConfig =
  | ChoiceStep
  | QualifyingStepTextlike
  | QualifyingStepRadio;

const choice = (
  q: Question,
  title?: string,
  description?: string,
): ChoiceStep => ({
  id: q.id,
  title: title ?? q.label,
  description: description ?? q.label,
  section: q.category,
  kind: "choice",
  question: q,
});

const radioOptions = <T extends string>(opts: { label: string; value: T }[]) =>
  opts;

const questions = [
  {
    id: "mobile-speed",
    label: "How fast do your pages load on mobile?",
    category: "Technical",
    options: [
      { label: "< 2s", value: "fast", score: 10 },
      {
        label: "2-4s",
        value: "ok",
        score: 6,
        insights: [
          {
            id: "speed-opt",
            message: "Improve mobile Core Web Vitals (LCP < 2.5s).",
            impactWeight: 7,
            category: "Technical",
          },
        ],
      },
      {
        label: "> 4s",
        value: "slow",
        score: 2,
        insights: [
          {
            id: "speed-critical",
            message:
              "Critical: reduce image sizes, enable caching, optimize JS for faster loads.",
            impactWeight: 10,
            category: "Technical",
          },
        ],
      },
      { label: "Not sure", value: "unknown", score: 4 },
    ],
  },
  {
    id: "mobile-friendly",
    label: "Is your site mobile-friendly and responsive?",
    category: "Technical",
    options: [
      { label: "Yes", value: "yes", score: 10 },
      { label: "Partially", value: "partial", score: 6 },
      {
        label: "No",
        value: "no",
        score: 2,
        insights: [
          {
            id: "mobile-responsive",
            message:
              "Implement responsive design; fix tap targets and viewport issues.",
            impactWeight: 8,
            category: "Technical",
          },
        ],
      },
      { label: "Not sure", value: "unknown", score: 4 },
    ],
  },
  {
    id: "indexation",
    label: "Are the pages you care about indexed?",
    category: "Technical",
    options: [
      { label: "All", value: "all", score: 10 },
      { label: "Most", value: "most", score: 7 },
      {
        label: "Some/Few",
        value: "few",
        score: 3,
        insights: [
          {
            id: "index-coverage",
            message:
              "Fix crawl/index issues: sitemaps, robots.txt, canonical tags.",
            impactWeight: 9,
            category: "Technical",
          },
        ],
      },
      { label: "Not sure", value: "unknown", score: 4 },
    ],
  },
  {
    id: "titles-meta",
    label: "Are titles and meta descriptions unique and optimized?",
    category: "OnPage",
    options: [
      { label: "All", value: "all", score: 10 },
      { label: "Most", value: "most", score: 7 },
      {
        label: "Some/Few",
        value: "few",
        score: 3,
        insights: [
          {
            id: "meta-unique",
            message:
              "Unique titles and compelling meta improve CTR and rankings.",
            impactWeight: 7,
            category: "OnPage",
          },
        ],
      },
      { label: "Not sure", value: "unknown", score: 4 },
    ],
  },
  {
    id: "keyword-mapping",
    label: "Do top pages target unique primary keywords?",
    category: "OnPage",
    options: [
      { label: "All", value: "all", score: 10 },
      { label: "Most", value: "most", score: 7 },
      {
        label: "Some/Few",
        value: "few",
        score: 3,
        insights: [
          {
            id: "keyword-map",
            message: "Map primary keywords to pages to avoid cannibalization.",
            impactWeight: 8,
            category: "OnPage",
          },
        ],
      },
      { label: "Not sure", value: "unknown", score: 4 },
    ],
  },
  {
    id: "cadence",
    label: "How often do you publish quality content?",
    category: "Content",
    options: [
      { label: "Weekly", value: "weekly", score: 10 },
      { label: "Biweekly", value: "biweekly", score: 8 },
      { label: "Monthly", value: "monthly", score: 5 },
      {
        label: "Rarely",
        value: "rare",
        score: 2,
        insights: [
          {
            id: "content-cadence",
            message:
              "Publish consistently; aim for weekly to compound traffic.",
            impactWeight: 8,
            category: "Content",
          },
        ],
      },
    ],
  },
  {
    id: "depth",
    label: "Do your pages comprehensively answer search intent?",
    category: "Content",
    options: [
      { label: "Yes", value: "yes", score: 10 },
      { label: "Mostly", value: "mostly", score: 7 },
      {
        label: "Sometimes/Rarely",
        value: "rare",
        score: 3,
        insights: [
          {
            id: "intent-depth",
            message:
              "Improve topical depth; satisfy intent with structure and examples.",
            impactWeight: 7,
            category: "Content",
          },
        ],
      },
    ],
  },
  {
    id: "ref-domains",
    label: "Approx. how many unique referring domains?",
    category: "Authority",
    options: [
      { label: "> 100", value: "100+", score: 10 },
      { label: "20-100", value: "20-100", score: 7 },
      {
        label: "< 20 / Not sure",
        value: "<20",
        score: 3,
        insights: [
          {
            id: "links-build",
            message: "Build quality links via outreach and partnerships.",
            impactWeight: 8,
            category: "Authority",
          },
        ],
      },
    ],
  },
  {
    id: "internal-links",
    label: "Do key pages have internal links from relevant pages?",
    category: "Authority",
    options: [
      { label: "Strong", value: "strong", score: 10 },
      { label: "Moderate", value: "moderate", score: 7 },
      {
        label: "Weak/None",
        value: "weak",
        score: 3,
        insights: [
          {
            id: "internal-linking",
            message:
              "Add internal links from related pages with descriptive anchors.",
            impactWeight: 7,
            category: "Authority",
          },
        ],
      },
    ],
  },
  {
    id: "analytics",
    label: "Do you track conversions/events (GA4/GTM)?",
    category: "Tracking",
    options: [
      { label: "Yes", value: "yes", score: 10 },
      { label: "Partially", value: "partial", score: 6 },
      {
        label: "No",
        value: "no",
        score: 2,
        insights: [
          {
            id: "track-conv",
            message: "Set up GA4 goals/events to measure business outcomes.",
            impactWeight: 6,
            category: "Tracking",
          },
        ],
      },
    ],
  },
] as const satisfies readonly Question[];

const steps = [
  // Question steps
  ...questions.map((q) => choice(q)),
  // Qualifying steps (separate per field)
  {
    id: "qual-name",
    title: "Your name",
    description: "Tell us who you are",
    section: "About You",
    kind: "qualifying",
    field: "name",
    inputType: "text",
  },
  {
    id: "qual-email",
    title: "Your email",
    description: "Where can we reach you?",
    section: "About You",
    kind: "qualifying",
    field: "email",
    inputType: "email",
  },
  {
    id: "qual-website",
    title: "Website URL",
    description: "Your primary website",
    section: "About You",
    kind: "qualifying",
    field: "websiteUrl",
    inputType: "url",
  },
  {
    id: "qual-profile",
    title: "Best describes you",
    description: "Choose your business type",
    section: "About You",
    kind: "qualifying",
    field: "profile",
    inputType: "radio",
    options: radioOptions([
      { label: "Local Business", value: "Local" },
      { label: "E-commerce", value: "Ecom" },
      { label: "SaaS", value: "SaaS" },
      { label: "Content/Media", value: "Content" },
      { label: "Other", value: "Other" },
    ]),
  },
  {
    id: "qual-desired",
    title: "Desired outcome (next 90 days)",
    description: "What do you want most?",
    section: "About You",
    kind: "qualifying",
    field: "desired",
    inputType: "radio",
    options: radioOptions([
      { label: "More leads", value: "Leads" },
      { label: "More online sales", value: "Sales" },
      { label: "Increase brand authority", value: "Authority" },
      { label: "Other", value: "Other" },
    ]),
  },
  {
    id: "qual-obstacle",
    title: "Biggest obstacle",
    description: "What's blocking progress?",
    section: "About You",
    kind: "qualifying",
    field: "obstacle",
    inputType: "radio",
    options: radioOptions([
      { label: "Don't know where to start", value: "Unsure" },
      { label: "Previous SEO agency failed", value: "BadAgency" },
      { label: "No time", value: "NoTime" },
      { label: "Budget uncertainty", value: "Budget" },
    ]),
  },
  {
    id: "qual-invested",
    title: "Past investment in SEO",
    description: "Have you invested before?",
    section: "About You",
    kind: "qualifying",
    field: "investedBefore",
    inputType: "radio",
    options: radioOptions([
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ]),
  },
  {
    id: "qual-notes",
    title: "Anything else we should know?",
    description: "Optional notes",
    section: "About You",
    kind: "qualifying",
    field: "notes",
    inputType: "textarea",
  },
] as const satisfies readonly StepConfig[];

export const QuizSteps = defineStepper(...steps);
export type QuizStep = (typeof steps)[number]["id"];

export const allSteps = steps;
export const questionSteps = steps.filter(
  (s): s is ChoiceStep => s.kind === "choice",
);
