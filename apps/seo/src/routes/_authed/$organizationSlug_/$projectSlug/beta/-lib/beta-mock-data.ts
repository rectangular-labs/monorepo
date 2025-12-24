import type { CalendarEvent } from "@rectangular-labs/ui/components/calendar/event-calendar/schema";

export type BetaDateRange = "7d" | "28d" | "90d";

export type VisibilityPoint = {
  date: string;
  visibility: number; // 0-100
};

export type TrafficPoint = {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number; // 0-1
  position: number; // lower is better
};

export type CompetitorRank = {
  name: string;
  score: number; // 0-100
  deltaPct: number; // +/- %
  isYou?: boolean;
};

export type ClusterStatus = "published" | "scheduled" | "review" | "draft";

export type ClusterMetrics = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type LlmVisibilityMetrics = {
  visibilityScore: number; // 0-100
  citations: number;
  mentions: number;
  answerShare: number; // 0-100
};

export type LlmVisibilityGoals = {
  visibilityScore: number;
  citations: number;
  mentions: number;
  answerShare: number;
};

export type LlmVisibility = {
  current: LlmVisibilityMetrics;
  previous: LlmVisibilityMetrics;
  goals: LlmVisibilityGoals;
};

export type Cluster = {
  id: string;
  name: string;
  pillarKeyword: string;
  lastUpdated: string;
  metrics: Record<
    BetaDateRange,
    { current: ClusterMetrics; previous: ClusterMetrics }
  >;
  goal: { clicks: number; impressions: number; byDate: string };
  llm: LlmVisibility;
  tree: ClusterTreeNode[];
};

export type ClusterTreeNode =
  | {
      type: "folder";
      id: string;
      keyword: string;
      description?: string;
      variants?: string[];
      metrics: ClusterMetrics;
      children: ClusterTreeNode[];
    }
  | {
      type: "file";
      id: string;
      title: string;
      targetKeyword: string;
      secondaryKeywords: string[];
      status: ClusterStatus;
      metrics: ClusterMetrics;
      url?: string;
      publishedAt?: string; // iso day
      intendedPublishDate?: string; // iso day
      content: string;
      llm: {
        current: LlmVisibilityMetrics;
        goals: LlmVisibilityGoals;
      };
    };

export type PendingReview = {
  id: string;
  title: string;
  clusterId: string;
  dueDate: string;
  items: Array<{
    id: string;
    articleId?: string;
    articleTitle: string;
    changeSummary: string;
    intendedPublishDate: string;
    status: "pending" | "approved";
  }>;
};

export type RecommendationActionKind = "expand" | "update" | "remove";

export type RecommendationAction = {
  id: string;
  kind: RecommendationActionKind;
  label: string;
  detail: string;
};

export type RecommendationPriority = "high" | "medium" | "low";

export type Recommendation = {
  id: string;
  title: string;
  summary: string;
  actions: RecommendationAction[];
  clusters: Cluster[];
  priority: RecommendationPriority;
};

function isoDay(d: Date) {
  return d?.toISOString().slice(0, 10);
}

function daysBack(n: number) {
  const out: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}

function dayAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

export const mockCompetitorRanks: CompetitorRank[] = [
  { name: "Chase", score: 92.0, deltaPct: 5.0 },
  { name: "Rho", score: 89.8, deltaPct: 1.0, isYou: true },
  { name: "American Express", score: 85.2, deltaPct: -1.0 },
  { name: "Capital on Tap", score: 78.0, deltaPct: 5.0 },
  { name: "US bank", score: 76.9, deltaPct: -2.0 },
  { name: "Bill", score: 72.3, deltaPct: 1.8 },
];

export const mockVisibilityTimeseries: VisibilityPoint[] = daysBack(7).map(
  (d, i) => {
    const base = 82 + Math.sin(i / 2) * 6;
    return { date: isoDay(d), visibility: Math.max(55, Math.min(98, base)) };
  },
);

export const mockTrafficTimeseries: TrafficPoint[] = daysBack(14).map(
  (d, i) => {
    const clicks = Math.round(420 + i * 12 + Math.sin(i / 2) * 55);
    const impressions = Math.round(8800 + i * 110 + Math.cos(i / 3) * 420);
    const ctr = Math.max(0.01, Math.min(0.14, clicks / impressions));
    const position = Math.max(1.2, 14.5 - i * 0.18 + Math.sin(i / 2) * 0.35);
    return {
      date: isoDay(d),
      clicks,
      impressions,
      ctr,
      position: Number(position.toFixed(1)),
    };
  },
);

export const mockClusters: Cluster[] = [
  {
    id: "clu_cards",
    name: "Business credit cards",
    pillarKeyword: "business credit cards",
    lastUpdated: isoDay(dayAgo(1)),
    metrics: {
      "7d": {
        current: { clicks: 820, impressions: 18600, ctr: 0.044, position: 6.2 },
        previous: {
          clicks: 710,
          impressions: 17100,
          ctr: 0.041,
          position: 6.8,
        },
      },
      "28d": {
        current: {
          clicks: 2910,
          impressions: 76200,
          ctr: 0.038,
          position: 7.1,
        },
        previous: {
          clicks: 2480,
          impressions: 71900,
          ctr: 0.034,
          position: 7.8,
        },
      },
      "90d": {
        current: {
          clicks: 8120,
          impressions: 219000,
          ctr: 0.037,
          position: 7.5,
        },
        previous: {
          clicks: 7440,
          impressions: 205000,
          ctr: 0.036,
          position: 7.9,
        },
      },
    },
    goal: {
      clicks: 12000,
      impressions: 300000,
      byDate: isoDay(dayAgo(1)),
    },
    llm: {
      current: {
        visibilityScore: 71,
        citations: 18,
        mentions: 44,
        answerShare: 22,
      },
      previous: {
        visibilityScore: 64,
        citations: 12,
        mentions: 36,
        answerShare: 16,
      },
      goals: {
        visibilityScore: 85,
        citations: 35,
        mentions: 75,
        answerShare: 40,
      },
    },
    tree: [
      {
        type: "file",
        id: "a_pillar_cards",
        title: "Business credit cards: the definitive guide",
        targetKeyword: "business credit cards",
        secondaryKeywords: [
          "small business credit cards",
          "business credit card offers",
          "best business credit cards",
        ],
        status: "published",
        url: "/guides/business-credit-cards",
        publishedAt: isoDay(dayAgo(45)),
        metrics: { clicks: 980, impressions: 21400, ctr: 0.046, position: 5.8 },
        content:
          "This pillar page consolidates the full cluster: eligibility, comparisons, and GEO angles.\n\nIt links out to the supporting articles and contains a short decision framework, a table of picks, and a GEO-friendly citations section.\n\n(Everything here is mocked.)",
        llm: {
          current: {
            visibilityScore: 73,
            citations: 9,
            mentions: 20,
            answerShare: 18,
          },
          goals: {
            visibilityScore: 86,
            citations: 18,
            mentions: 40,
            answerShare: 30,
          },
        },
      },
      {
        type: "folder",
        id: "kw_cards_eligibility",
        keyword: "business credit card eligibility",
        description: "SMB vs enterprise requirements and common gotchas.",
        variants: [
          "eligibility requirements for business credit cards",
          "who qualifies for a business credit card",
        ],
        metrics: { clicks: 520, impressions: 10200, ctr: 0.051, position: 5.9 },
        children: [
          {
            type: "file",
            id: "a_eligibility",
            title: "Eligibility requirements for business credit cards",
            targetKeyword: "business credit card eligibility",
            secondaryKeywords: [
              "business credit card requirements",
              "EIN vs SSN business card",
            ],
            status: "published",
            url: "/guides/business-credit-card-eligibility",
            publishedAt: isoDay(dayAgo(120)),
            metrics: {
              clicks: 210,
              impressions: 3800,
              ctr: 0.055,
              position: 5.4,
            },
            content:
              "Short answer: you don't always need an EIN — but it depends.\n\nThis article splits SMB vs enterprise requirements, documents underwriting signals, and includes a mini FAQ.\n\n(Mock content.)",
            llm: {
              current: {
                visibilityScore: 62,
                citations: 3,
                mentions: 9,
                answerShare: 10,
              },
              goals: {
                visibilityScore: 80,
                citations: 8,
                mentions: 20,
                answerShare: 22,
              },
            },
          },
        ],
      },
      {
        type: "folder",
        id: "kw_cards_best",
        keyword: "best business credit cards",
        description:
          "Roundups and comparisons that win snippets + GEO mentions.",
        variants: [
          "best business credit cards 2026",
          "top business credit cards",
        ],
        metrics: { clicks: 430, impressions: 9100, ctr: 0.047, position: 6.3 },
        children: [
          {
            type: "file",
            id: "a_best_cards",
            title: "Best business credit cards (2026)",
            targetKeyword: "best business credit cards",
            secondaryKeywords: [
              "best business credit cards 2026",
              "top business credit cards",
            ],
            status: "review",
            url: "/comparisons/best-business-credit-cards-2026",
            intendedPublishDate: isoDay(daysFromNow(7)),
            metrics: {
              clicks: 160,
              impressions: 3400,
              ctr: 0.047,
              position: 6.1,
            },
            content:
              "This is the money page: pick-by-pick breakdown, a fast decision tree, and GEO-friendly comparisons.\n\n(Mock content.)",
            llm: {
              current: {
                visibilityScore: 68,
                citations: 4,
                mentions: 12,
                answerShare: 14,
              },
              goals: {
                visibilityScore: 86,
                citations: 12,
                mentions: 30,
                answerShare: 28,
              },
            },
          },
          {
            type: "folder",
            id: "kw_cards_geo",
            keyword: "rho vs alternatives",
            description: "GEO comparison angles for business cards.",
            variants: ["rho vs chase ink", "rho vs amex business"],
            metrics: {
              clicks: 300,
              impressions: 8400,
              ctr: 0.036,
              position: 7.0,
            },
            children: [
              {
                type: "file",
                id: "a_rho_vs",
                title: "Rho vs alternatives: which business card wins?",
                targetKeyword: "rho vs alternatives business card",
                secondaryKeywords: ["rho vs amex business", "rho vs chase ink"],
                status: "draft",
                url: "/comparisons/rho-vs-alternatives",
                intendedPublishDate: isoDay(daysFromNow(14)),
                metrics: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
                content:
                  "This comparison is designed for GEO: concise claims, source blocks, and clear pros/cons.\n\n(Mock content.)",
                llm: {
                  current: {
                    visibilityScore: 0,
                    citations: 0,
                    mentions: 0,
                    answerShare: 0,
                  },
                  goals: {
                    visibilityScore: 70,
                    citations: 6,
                    mentions: 12,
                    answerShare: 20,
                  },
                },
              },
              {
                type: "file",
                id: "a_mention_playbook",
                title: "How to get mentioned in AI answers for business cards",
                targetKeyword: "get mentioned in AI answers for business cards",
                secondaryKeywords: [
                  "GEO for business credit cards",
                  "LLM citations playbook",
                ],
                status: "scheduled",
                url: "/playbooks/ai-mentions-business-cards",
                intendedPublishDate: isoDay(daysFromNow(21)),
                metrics: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
                content:
                  "Playbook: citations, sources, and structural patterns that models tend to reuse.\n\n(Mock content.)",
                llm: {
                  current: {
                    visibilityScore: 0,
                    citations: 0,
                    mentions: 0,
                    answerShare: 0,
                  },
                  goals: {
                    visibilityScore: 75,
                    citations: 10,
                    mentions: 18,
                    answerShare: 25,
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "clu_accounting",
    name: "Accounting automation",
    pillarKeyword: "accounting automation",
    lastUpdated: isoDay(dayAgo(2)),
    metrics: {
      "7d": {
        current: { clicks: 260, impressions: 9900, ctr: 0.026, position: 10.8 },
        previous: { clicks: 310, impressions: 9200, ctr: 0.034, position: 9.7 },
      },
      "28d": {
        current: {
          clicks: 980,
          impressions: 41200,
          ctr: 0.024,
          position: 11.1,
        },
        previous: {
          clicks: 1240,
          impressions: 39800,
          ctr: 0.031,
          position: 10.2,
        },
      },
      "90d": {
        current: {
          clicks: 2910,
          impressions: 128000,
          ctr: 0.023,
          position: 11.4,
        },
        previous: {
          clicks: 3320,
          impressions: 124000,
          ctr: 0.027,
          position: 10.9,
        },
      },
    },
    goal: {
      clicks: 5000,
      impressions: 160000,
      byDate: isoDay(dayAgo(1)),
    },
    llm: {
      current: {
        visibilityScore: 58,
        citations: 7,
        mentions: 21,
        answerShare: 14,
      },
      previous: {
        visibilityScore: 62,
        citations: 8,
        mentions: 23,
        answerShare: 15,
      },
      goals: {
        visibilityScore: 78,
        citations: 18,
        mentions: 45,
        answerShare: 28,
      },
    },
    tree: [
      {
        type: "file",
        id: "a_pillar_accounting",
        title: "Accounting automation: the operations playbook",
        targetKeyword: "accounting automation",
        secondaryKeywords: [
          "automate accounting",
          "accounting workflow automation",
          "close the books faster",
        ],
        status: "published",
        url: "/guides/accounting-automation",
        publishedAt: isoDay(dayAgo(90)),
        metrics: { clicks: 260, impressions: 9900, ctr: 0.026, position: 10.8 },
        content:
          "Pillar: what to automate, what to measure, and how to sequence improvements.\n\n(Mock content.)",
        llm: {
          current: {
            visibilityScore: 56,
            citations: 2,
            mentions: 8,
            answerShare: 10,
          },
          goals: {
            visibilityScore: 76,
            citations: 8,
            mentions: 20,
            answerShare: 22,
          },
        },
      },
      {
        type: "folder",
        id: "kw_acc_close",
        keyword: "close the books faster",
        description: "Month-end close automation and checklists.",
        variants: ["close process automation", "month-end close automation"],
        metrics: { clicks: 260, impressions: 9900, ctr: 0.026, position: 10.8 },
        children: [
          {
            type: "file",
            id: "a_close_books",
            title: "Close the books faster with automation",
            targetKeyword: "close the books faster",
            secondaryKeywords: [
              "month-end close automation",
              "close checklist",
            ],
            status: "published",
            url: "/guides/close-the-books-faster",
            publishedAt: isoDay(dayAgo(150)),
            metrics: {
              clicks: 140,
              impressions: 4300,
              ctr: 0.033,
              position: 10.1,
            },
            content:
              "Framework for month-end close: tasks, owners, and automation opportunities.\n\n(Mock content.)",
            llm: {
              current: {
                visibilityScore: 52,
                citations: 1,
                mentions: 5,
                answerShare: 8,
              },
              goals: {
                visibilityScore: 72,
                citations: 6,
                mentions: 15,
                answerShare: 18,
              },
            },
          },
          {
            type: "file",
            id: "a_checklist",
            title: "Accounting automation checklist",
            targetKeyword: "accounting automation checklist",
            secondaryKeywords: [
              "automation checklist accounting",
              "accounting automation steps",
            ],
            status: "published",
            url: "/checklists/accounting-automation",
            publishedAt: isoDay(dayAgo(70)),
            metrics: {
              clicks: 120,
              impressions: 5600,
              ctr: 0.021,
              position: 11.6,
            },
            content:
              "Checklist: high-leverage automation wins, ordered by effort and impact.\n\n(Mock content.)",
            llm: {
              current: {
                visibilityScore: 49,
                citations: 1,
                mentions: 6,
                answerShare: 6,
              },
              goals: {
                visibilityScore: 70,
                citations: 6,
                mentions: 18,
                answerShare: 16,
              },
            },
          },
        ],
      },
    ],
  },
  {
    id: "clu_geo_mentions",
    name: "GEO mentions",
    pillarKeyword: "get mentioned in AI answers",
    lastUpdated: isoDay(dayAgo(3)),
    metrics: {
      "7d": {
        current: { clicks: 140, impressions: 5200, ctr: 0.027, position: 8.8 },
        previous: { clicks: 95, impressions: 4100, ctr: 0.023, position: 9.6 },
      },
      "28d": {
        current: { clicks: 520, impressions: 20100, ctr: 0.026, position: 9.1 },
        previous: { clicks: 370, impressions: 18600, ctr: 0.02, position: 9.8 },
      },
      "90d": {
        current: {
          clicks: 1510,
          impressions: 64000,
          ctr: 0.024,
          position: 9.3,
        },
        previous: {
          clicks: 1290,
          impressions: 62100,
          ctr: 0.021,
          position: 9.7,
        },
      },
    },
    goal: { clicks: 2600, impressions: 90000, byDate: isoDay(dayAgo(1)) },
    llm: {
      current: {
        visibilityScore: 82,
        citations: 22,
        mentions: 65,
        answerShare: 41,
      },
      previous: {
        visibilityScore: 76,
        citations: 18,
        mentions: 54,
        answerShare: 34,
      },
      goals: {
        visibilityScore: 90,
        citations: 40,
        mentions: 90,
        answerShare: 55,
      },
    },
    tree: [
      {
        type: "file",
        id: "a_pillar_geo_mentions",
        title: "How to get mentioned in AI answers: the GEO playbook",
        targetKeyword: "get mentioned in AI answers",
        secondaryKeywords: [
          "GEO playbook",
          "LLM citations",
          "AI answer visibility",
        ],
        status: "published",
        url: "/playbooks/geo-mentions",
        publishedAt: isoDay(dayAgo(40)),
        metrics: { clicks: 140, impressions: 5200, ctr: 0.027, position: 8.8 },
        content:
          "Pillar: sources, structure, claims, and internal links that earn citations.\n\n(Mock content.)",
        llm: {
          current: {
            visibilityScore: 84,
            citations: 9,
            mentions: 28,
            answerShare: 24,
          },
          goals: {
            visibilityScore: 92,
            citations: 16,
            mentions: 45,
            answerShare: 35,
          },
        },
      },
      {
        type: "folder",
        id: "kw_geo_sources",
        keyword: "citation strategy",
        description: "Sources and credibility signals models reuse.",
        variants: ["citations that models trust", "source strategy for LLMs"],
        metrics: { clicks: 140, impressions: 5200, ctr: 0.027, position: 8.8 },
        children: [
          {
            type: "file",
            id: "a_sources",
            title: "Source strategy: citations that models trust",
            targetKeyword: "citation strategy for LLMs",
            secondaryKeywords: [
              "citations that models trust",
              "source strategy",
            ],
            status: "review",
            url: "/playbooks/citation-strategy",
            intendedPublishDate: isoDay(daysFromNow(5)),
            metrics: {
              clicks: 60,
              impressions: 2100,
              ctr: 0.029,
              position: 8.3,
            },
            content:
              "Guide: what to cite, where to cite, and how to format evidence blocks.\n\n(Mock content.)",
            llm: {
              current: {
                visibilityScore: 66,
                citations: 3,
                mentions: 11,
                answerShare: 12,
              },
              goals: {
                visibilityScore: 88,
                citations: 12,
                mentions: 28,
                answerShare: 28,
              },
            },
          },
          {
            type: "folder",
            id: "kw_geo_comparisons",
            keyword: "comparison pages",
            description: "Comparisons that reliably win mentions.",
            variants: [
              "comparison pages that win AI mentions",
              "GEO comparisons",
            ],
            metrics: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
            children: [
              {
                type: "file",
                id: "a_comparisons",
                title: "Comparison pages that win AI mentions",
                targetKeyword: "comparison pages that win AI mentions",
                secondaryKeywords: ["GEO comparisons", "AI answer comparisons"],
                status: "scheduled",
                url: "/playbooks/ai-comparison-pages",
                intendedPublishDate: isoDay(daysFromNow(10)),
                metrics: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
                content:
                  "Blueprint for comparison pages: claim blocks, tables, and internal links.\n\n(Mock content.)",
                llm: {
                  current: {
                    visibilityScore: 0,
                    citations: 0,
                    mentions: 0,
                    answerShare: 0,
                  },
                  goals: {
                    visibilityScore: 85,
                    citations: 10,
                    mentions: 22,
                    answerShare: 24,
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

export const mockPendingReviews: PendingReview[] = [
  {
    id: "rev_1",
    title: "Update: Best business credit cards (2026)",
    clusterId: "clu_cards",
    dueDate: isoDay(dayAgo(0)),
    items: [
      {
        id: "rev_1_item_1",
        articleTitle: "Best business credit cards (2026)",
        changeSummary:
          "Refresh comparisons, add GEO “mentioned in AI answers” section.",
        intendedPublishDate: isoDay(daysFromNow(7)),
        status: "pending",
      },
      {
        id: "rev_1_item_2",
        articleTitle: "Eligibility requirements for business credit cards",
        changeSummary: "Fix intent drift: split SMB vs enterprise eligibility.",
        intendedPublishDate: isoDay(daysFromNow(3)),
        status: "pending",
      },
    ],
  },
  {
    id: "rev_2",
    title: "Audit: Accounting automation checklist",
    clusterId: "clu_accounting",
    dueDate: isoDay(dayAgo(2)),
    items: [
      {
        id: "rev_2_item_1",
        articleTitle: "Accounting automation checklist",
        changeSummary: "Improve CTR: new title + meta; add FAQ block.",
        intendedPublishDate: isoDay(daysFromNow(10)),
        status: "pending",
      },
    ],
  },
];

function requiredCluster(idx: number): Cluster {
  const c = mockClusters[idx];
  if (!c) throw new Error(`Missing mock cluster at index ${idx}`);
  return c;
}

export const mockRecommendations: Recommendation[] = [
  {
    id: "rec_geo_push",
    title: "Turn momentum into GEO comparisons + citations",
    priority: "high",
    summary:
      "Traffic is rising in the pillar; capture LLM citations with comparison pages, tight internal linking, and refreshed “best of” sections.",
    clusters: [requiredCluster(0), requiredCluster(2)],
    actions: [
      {
        id: "a1",
        kind: "expand",
        label: "Add 6 supporting pages",
        detail:
          "Build long-tail pages + comparison angles and map to internal links.",
      },
      {
        id: "a2",
        kind: "update",
        label: "Refresh the pillar + top performers",
        detail:
          "Fix intent drift, update examples, and strengthen GEO-friendly sections.",
      },
    ],
  },
  {
    id: "rec_ctr_fix",
    title: "Recover CTR losses with snippet + intent alignment",
    priority: "medium",
    summary:
      "CTR is lagging vs impressions. Tighten titles/meta, improve above-the-fold answers, and ensure pages match query intent.",
    clusters: [requiredCluster(1)],
    actions: [
      {
        id: "a3",
        kind: "update",
        label: "Rewrite titles/meta for top queries",
        detail: "Create 3 alternative title + meta sets and test quickly.",
      },
      {
        id: "a4",
        kind: "expand",
        label: "Create an intent-bridge page",
        detail:
          "Add a hub page for mixed-intent queries and link to exact answers.",
      },
    ],
  },
  {
    id: "rec_cleanup",
    title: "Cleanup thin/duplicate pages to reduce cannibalization",
    priority: "low",
    summary:
      "Reduce internal competition and improve crawl quality by consolidating thin pages, redirecting duplicates, and pruning stale comparisons.",
    clusters: [requiredCluster(0)],
    actions: [
      {
        id: "a5",
        kind: "remove",
        label: "Consolidate duplicates",
        detail:
          "Merge duplicate “pricing explainer” content into the pillar and 301 the rest.",
      },
      {
        id: "a6",
        kind: "remove",
        label: "Retire stale vendor comparisons",
        detail:
          "Redirect to the closest evergreen alternative and add a deindex plan if needed.",
      },
      {
        id: "a7",
        kind: "update",
        label: "Strengthen internal linking",
        detail:
          "Rebuild link paths from updated hubs to priority supporting pages.",
      },
    ],
  },
];

export const mockScheduleEvents: CalendarEvent[] = [
  {
    id: "evt_1",
    title: "Draft: Rho vs alternatives",
    start: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60),
    color: "blue",
  },
  {
    id: "evt_2",
    title: "Review: Best business credit cards (2026)",
    start: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
    end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4 + 1000 * 60 * 60),
    color: "orange",
  },
  {
    id: "evt_3",
    title: "Publish: GEO mentions playbook",
    start: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6),
    end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6 + 1000 * 60 * 60),
    color: "emerald",
  },
];
