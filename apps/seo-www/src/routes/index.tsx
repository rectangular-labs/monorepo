import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Logo } from "@rectangular-labs/ui/components/icon";
import { SerpClimbDemo } from "~/routes/-components/founders/serp-climb-v2";
import { LiquidGradientBackground } from "~/routes/-components/founders/landing-sections-demo";
import { WaitListDialog } from "~/routes/-components/waitlist-dialog";

export const Route = createFileRoute("/")({
  component: App,

  head: () => ({
    scripts: [
      {
        src:
          "https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=" +
          Math.random().toString(36).substring(7),
        async: true,
        defer: true,
        onLoad: () =>
          // biome-ignore lint/suspicious/noExplicitAny: apollo tracking
          (window as any).trackingFunctions.onLoad({
            appId: "68e8553db8cc65001148717d",
          }),
      },
    ],
  }),
});

// ============================================
// SOCIAL PROOF - Single Quote
// ============================================

function SocialProofSection() {
  return (
    <section className="relative overflow-hidden bg-emerald-700 py-12 sm:py-16 dark:bg-emerald-950">
      {/* Subtle dot pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[length:30px_30px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_1px,transparent_1px)]" />
      </div>
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <blockquote className="font-serif text-emerald-50 text-lg italic leading-relaxed sm:text-xl md:text-2xl">
          &quot;Our website ranked #1 for relevant keywords within a month of using Fluid Posts.&quot;
        </blockquote>
        <p className="mt-6 text-emerald-100 text-sm sm:text-base">
          Bowen Xue · Founder, Dispute Ninja
        </p>
      </div>
    </section>
  );
}

// ============================================
// ANIMATED NETWORK GRAPH
// ============================================

function NetworkGraph() {
  const nodes = useMemo(() => {
    const generated: Array<{ id: number; x: number; y: number; size: number; opacity: number }> = [];
    for (let i = 0; i < 80; i++) {
      generated.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 8 + 3,
        opacity: Math.random() * 0.6 + 0.2,
      });
    }
    return generated;
  }, []);

  const connections = useMemo(() => {
    const lines: Array<{ from: number; to: number; opacity: number }> = [];
    for (let i = 0; i < nodes.length; i++) {
      const numConnections = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numConnections; j++) {
        const target = Math.floor(Math.random() * nodes.length);
        if (target !== i) {
          lines.push({ from: i, to: target, opacity: Math.random() * 0.3 + 0.1 });
        }
      }
    }
    return lines;
  }, [nodes]);

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-2xl border-2 border-neutral-300 bg-neutral-50 sm:h-[400px] dark:border-neutral-600 dark:bg-neutral-800">
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {connections.map((conn, i) => {
          const fromNode = nodes[conn.from];
          const toNode = nodes[conn.to];
          if (!fromNode || !toNode) return null;
          return (
            <motion.line
              key={`line-${conn.from}-${conn.to}-${i}`}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              className="stroke-neutral-400 dark:stroke-neutral-500"
              strokeWidth="0.15"
              opacity={conn.opacity}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: i * 0.01 }}
            />
          );
        })}
        {nodes.map((node) => (
          <motion.circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={node.size / 10}
            className="fill-neutral-700 dark:fill-neutral-300"
            opacity={node.opacity}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: node.id * 0.02 }}
          />
        ))}
      </svg>
    </div>
  );
}

// ============================================
// COMPLETE SEO, AUTOMATED
// ============================================

function JourneySection() {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-24 dark:bg-neutral-950">
      {/* Grid pattern with subtle fade - animated */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.28] dark:opacity-[0.32]">
        <svg className="absolute inset-0 h-full w-full animate-grid-flow" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <pattern id="grid-pattern" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M0 32V0h32" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-emerald-600" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-neutral-950 dark:via-transparent dark:to-neutral-950" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center sm:mb-20">
          <h2 className="mb-4 font-light font-serif text-[28px] text-neutral-900 leading-[1.1] tracking-[-0.02em] sm:text-[36px] md:text-[48px] dark:text-white">
            Complete SEO, automated<span className="text-emerald-600">.</span>
          </h2>
          <p className="mx-auto mb-6 max-w-2xl text-base text-neutral-500 sm:text-lg dark:text-neutral-400">
            From strategy to publishing—we handle it all.
          </p>
          {/* Decorative line */}
          <div className="mx-auto h-0.5 w-16 bg-emerald-600 dark:bg-emerald-400" />
        </div>

        {/* Step 1: Content Strategy */}
        <div className="mb-16 sm:mb-24">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <h3 className="mb-4 flex items-center font-light font-serif text-[28px] text-neutral-900 leading-[1.1] tracking-[-0.02em] sm:text-[36px] md:text-[44px] dark:text-white">
                <span className="mr-3 font-mono text-base text-emerald-600 sm:text-lg md:text-xl dark:text-emerald-400">01</span>
                Content Strategy
              </h3>
              <p className="mb-6 text-base text-neutral-500 leading-relaxed sm:text-lg dark:text-neutral-400">
                Based on your onboarding, we research your business, target users, and tailor strategies to reach your audience.
              </p>
              <ul className="space-y-3 text-neutral-600 text-sm sm:text-base dark:text-neutral-300">
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Custom strategy based on your business goals</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>SEO-optimized articles written for you</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Automated publishing to your CMS</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              {/* Strategy mockup - Toothbrush business example */}
              <div className="overflow-hidden rounded-2xl border-2 border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800">
                <div className="border-neutral-100 border-b px-4 py-4 sm:px-6 dark:border-neutral-700">
                  <div className="mb-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700 text-xs dark:bg-emerald-900/30 dark:text-emerald-400">
                    Suggestion
                  </div>
                  <h4 className="font-serif text-base text-neutral-900 tracking-[-0.01em] sm:text-lg dark:text-white">Electric Toothbrush Buyer&apos;s Guide Cluster</h4>
                  <p className="mt-1 text-neutral-500 text-xs sm:text-sm dark:text-neutral-400">Goal: <span className="text-neutral-900 dark:text-white">12,000 impressions per month</span></p>
                </div>
                <div className="px-4 py-4 sm:px-6">
                  <div className="mb-3">
                    <p className="mb-1 font-medium text-neutral-400 text-xs uppercase tracking-wider">Motivation</p>
                    <p className="text-neutral-600 text-xs leading-relaxed sm:text-sm dark:text-neutral-300">
                      High-intent buyers searching &quot;best electric toothbrush&quot; are ready to purchase. Capturing these queries drives qualified leads directly to your product pages.
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-neutral-400 text-xs uppercase tracking-wider">Description</p>
                    <p className="text-neutral-600 text-xs leading-relaxed sm:text-sm dark:text-neutral-300">
                      Create comparison guides targeting &quot;how to choose a toothbrush&quot;, &quot;electric vs manual toothbrush&quot;, and &quot;best toothbrush for sensitive teeth&quot;.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-neutral-100 border-t px-4 py-4 sm:gap-3 sm:px-6 dark:border-neutral-700">
                  <button type="button" className="rounded-lg border border-neutral-200 px-3 py-1.5 text-neutral-600 text-xs transition-colors hover:bg-neutral-50 sm:px-4 sm:py-2 sm:text-sm dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700">Dismiss</button>
                  <button type="button" className="rounded-lg border border-neutral-200 px-3 py-1.5 text-neutral-600 text-xs transition-colors hover:bg-neutral-50 sm:px-4 sm:py-2 sm:text-sm dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700">Modify</button>
                  <button type="button" className="rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-emerald-700 sm:px-4 sm:py-2 sm:text-sm">Adopt Strategy</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Authority Network */}
        <div>
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="order-2 lg:order-1">
              <NetworkGraph />
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="mb-4 flex items-center font-light font-serif text-[28px] text-neutral-900 leading-[1.1] tracking-[-0.02em] sm:text-[36px] md:text-[44px] dark:text-white">
                <span className="mr-3 font-mono text-base text-emerald-600 sm:text-lg md:text-xl dark:text-emerald-400">02</span>
                Authority Network
              </h3>
              <p className="text-base text-neutral-500 leading-relaxed sm:text-lg dark:text-neutral-400">
                We pass trusted backlinks across our network, strengthening domain authority and compounding visibility.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// RESULTS - Two Client Cards (AirOps style)
// ============================================

function ResultsSection() {
  return (
    <section className="relative overflow-hidden bg-emerald-50 py-16 sm:py-24 dark:bg-neutral-900">
      {/* Circle grid pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.22]">
        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <pattern id="circle-grid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="25" r="1.5" fill="currentColor" className="text-emerald-600" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circle-grid)" />
        </svg>
      </div>
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-8 text-center sm:mb-12">
          <h2 className="mb-4 font-light font-serif text-[28px] text-neutral-900 leading-[1.1] tracking-[-0.02em] sm:text-[36px] md:text-[48px] dark:text-white">
            Real Results<span className="text-emerald-600">.</span>
          </h2>
          <div className="mx-auto h-0.5 w-16 bg-emerald-600 dark:bg-emerald-400" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {/* Dispute Ninja Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-amber-100 p-6 transition-transform hover:scale-[1.02] sm:p-8 dark:bg-amber-900/90">
            <div className="mb-6">
              <p className="font-serif text-lg text-neutral-900 tracking-[-0.01em] sm:text-xl dark:text-white">DisputeNinja</p>
              <p className="text-neutral-600 text-xs sm:text-sm dark:text-neutral-300">B2B SaaS</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl text-neutral-900 sm:text-3xl dark:text-white">0 → 1,000</span>
                <span className="text-neutral-600 text-sm dark:text-neutral-300">monthly visitors</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-neutral-700 text-sm dark:text-neutral-200">#1 on Google for target keywords</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-neutral-700 text-sm dark:text-neutral-200">Cited on ChatGPT</span>
              </div>
            </div>
            <p className="mt-4 text-neutral-500 text-xs dark:text-neutral-400">Results achieved within 1 month</p>
          </div>

          {/* QuantumByte Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-emerald-800 p-6 transition-transform hover:scale-[1.02] sm:p-8 dark:bg-emerald-900">
            <div className="mb-6">
              <p className="font-serif text-lg text-white tracking-[-0.01em] sm:text-xl">QuantumByte</p>
              <p className="text-emerald-200 text-xs sm:text-sm">B2C SaaS</p>
            </div>
            <div className="space-y-3">
              <div>
                <span className="font-serif text-3xl text-white sm:text-4xl">+486%</span>
                <span className="ml-2 text-emerald-200 text-sm">clicks</span>
              </div>
              <div>
                <span className="font-serif text-3xl text-white sm:text-4xl">+906%</span>
                <span className="ml-2 text-emerald-200 text-sm">impressions</span>
              </div>
            </div>
            <p className="mt-4 text-emerald-300 text-xs">Results achieved within 1 month</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FEATURE ICONS
// ============================================

function PerformanceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function AuditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  );
}

function ArticleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function InsightsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

// ============================================
// FEATURES - THE WHOLE SUITE (Light mode with platform render)
// ============================================

function FeaturesSection() {
  const [activeTab, setActiveTab] = useState<"performance" | "strategies" | "chat">("performance");
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const tabs = ["performance", "strategies", "chat"] as const;

  const cycleTab = useCallback(() => {
    if (isAutoPlaying) {
      setActiveTab((current) => {
        const currentIndex = tabs.indexOf(current);
        const nextIndex = (currentIndex + 1) % tabs.length;
        return tabs[nextIndex] ?? "performance";
      });
    }
  }, [isAutoPlaying, tabs]);

  useEffect(() => {
    const interval = setInterval(cycleTab, 5000);
    return () => clearInterval(interval);
  }, [cycleTab]);

  const handleTabClick = (tab: typeof activeTab) => {
    setIsAutoPlaying(false);
    setActiveTab(tab);
    setTimeout(() => setIsAutoPlaying(true), 15000);
  };

  const featureGroups = [
    {
      title: "Performance Tracking",
      icon: PerformanceIcon,
      items: null,
      desc: "Track key metrics like clicks and impressions for your whole website, and within clusters we suggest.",
    },
    {
      title: "Self-Auditing",
      icon: AuditIcon,
      items: null,
      desc: "Fluid Posts audits its performance biweekly and shares its honest assessment with you.",
    },
    {
      title: "Article Generation",
      icon: ArticleIcon,
      items: ["Auto Image Generation", "SEO-Optimized Articles", "Organic Product Mentions", "Auto Publishing with CMS Integration"],
      desc: null,
    },
    {
      title: "Business Insights",
      icon: InsightsIcon,
      items: null,
      desc: "Actionable product and service insights and recommendations based on organic performance.",
    },
    {
      title: "Chat About Anything",
      icon: ChatIcon,
      items: null,
      desc: "Have questions about your SEO, GEO, or business insights? Just ask chat.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-24 dark:bg-neutral-950">
      {/* Same grid pattern as Complete SEO - with subtle flow animation */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.28] dark:opacity-[0.32]">
        <svg className="absolute inset-0 h-full w-full animate-grid-flow" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <pattern id="suite-grid-pattern" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M0 32V0h32" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-emerald-600" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#suite-grid-pattern)" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-neutral-950 dark:via-transparent dark:to-neutral-950" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center sm:mb-16">
          <h2 className="mb-4 font-light font-serif text-[28px] text-neutral-900 leading-[1.1] tracking-[-0.02em] sm:text-[36px] md:text-[48px] dark:text-white">
            The Whole Suite<span className="text-emerald-600 dark:text-emerald-400">.</span> And More<span className="text-emerald-600 dark:text-emerald-400">.</span>
          </h2>
          <p className="mx-auto mb-6 max-w-2xl text-base text-neutral-500 sm:text-lg dark:text-neutral-400">
            Fluid Posts is the only point of contact you need for SEO. Monitor performance, create articles, 
            ask questions, and watch it audit itself biweekly.
          </p>
          <div className="mx-auto h-0.5 w-16 bg-emerald-600 dark:bg-emerald-400" />
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Interactive Platform Mockup */}
          <div className="relative">
            {/* Tab switcher */}
            <div className="mb-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleTabClick("performance")}
                className={`rounded-lg border-2 px-3 py-1.5 font-medium text-xs transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                  activeTab === "performance" 
                    ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-600 dark:bg-emerald-600 dark:text-white" 
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                }`}
              >
                Performance
              </button>
              <button
                type="button"
                onClick={() => handleTabClick("strategies")}
                className={`rounded-lg border-2 px-3 py-1.5 font-medium text-xs transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                  activeTab === "strategies" 
                    ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-600 dark:bg-emerald-600 dark:text-white" 
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                }`}
              >
                Strategies
              </button>
              <button
                type="button"
                onClick={() => handleTabClick("chat")}
                className={`rounded-lg border-2 px-3 py-1.5 font-medium text-xs transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                  activeTab === "chat" 
                    ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-600 dark:bg-emerald-600 dark:text-white" 
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                }`}
              >
                Chat
              </button>
            </div>

            {/* Platform mockup - with dark mode support */}
            <div className="overflow-hidden rounded-2xl border-2 border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900">
                <div className="flex h-8 items-center gap-2 border-neutral-200 border-b bg-neutral-50 px-4 dark:border-neutral-700 dark:bg-neutral-800">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-4 text-neutral-400 text-xs">FluidPosts</span>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "performance" && (
                  <motion.div
                    key="performance"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-[340px] p-4 sm:h-[380px] sm:p-6"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-serif text-lg text-neutral-900 sm:text-xl dark:text-white">BrightSmile Dental Co</h4>
                        <p className="text-neutral-500 text-xs sm:text-sm dark:text-neutral-400">Monitor clicks, impressions, and top queries</p>
                      </div>
                      <div className="rounded-lg border border-neutral-200 px-2 py-1 text-neutral-500 text-xs sm:px-3 dark:border-neutral-700 dark:text-neutral-400">
                        Last 28 days
                      </div>
                    </div>
                    <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="rounded-xl p-3 sm:p-4">
                        <p className="text-neutral-600 text-xs dark:text-neutral-400">Total Clicks</p>
                        <p className="font-serif text-neutral-900 text-xl sm:text-2xl dark:text-white">4,821</p>
                        <p className="font-semibold text-emerald-600 text-xs dark:text-emerald-400">+892%</p>
                      </div>
                      <div className="rounded-xl p-3 sm:p-4">
                        <p className="text-neutral-600 text-xs dark:text-neutral-400">Total Impressions</p>
                        <p className="font-serif text-neutral-900 text-xl sm:text-2xl dark:text-white">1.2M</p>
                        <p className="font-semibold text-emerald-600 text-xs dark:text-emerald-400">+1,247%</p>
                      </div>
                    </div>
                    <div className="h-32 rounded-xl p-3 sm:h-40 sm:p-4">
                      <p className="mb-2 text-neutral-600 text-xs dark:text-neutral-400">Clicks & Impressions over time</p>
                      <svg className="h-full w-full" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
                        <path
                          d="M0,58 Q50,57 100,52 Q150,40 175,20 Q190,8 200,2"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                        />
                        <path
                          d="M0,58 Q50,57 100,52 Q150,40 175,20 Q190,8 200,2 L200,60 L0,60 Z"
                          fill="url(#gradientLight)"
                          opacity="0.3"
                        />
                        <defs>
                          <linearGradient id="gradientLight" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </motion.div>
                )}

                {activeTab === "strategies" && (
                  <motion.div
                    key="strategies"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-[340px] p-4 sm:h-[380px] sm:p-6"
                  >
                    <div className="mb-4">
                      <h4 className="font-serif text-lg text-neutral-900 sm:text-xl dark:text-white">Active Strategies</h4>
                      <p className="text-neutral-500 text-xs sm:text-sm dark:text-neutral-400">Strategies currently executing</p>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-xl border-4 border-neutral-300 bg-neutral-50 p-3 sm:p-4 dark:border-neutral-600 dark:bg-neutral-800">
                        <div className="mb-2 inline-flex rounded-full bg-emerald-500 px-2 py-0.5 font-medium text-white text-xs dark:bg-emerald-600">
                          Active
                        </div>
                        <h5 className="mb-1 font-medium text-neutral-900 text-sm dark:text-white">Electric Toothbrush Buyer&apos;s Guide</h5>
                        <p className="text-neutral-600 text-xs dark:text-neutral-400">Goal: 12,000 impressions per month</p>
                      </div>
                      <div className="rounded-xl border-4 border-neutral-300 bg-neutral-50 p-3 sm:p-4 dark:border-neutral-600 dark:bg-neutral-800">
                        <div className="mb-2 inline-flex rounded-full bg-amber-500 px-2 py-0.5 font-medium text-white text-xs dark:bg-amber-600">
                          Suggestion
                        </div>
                        <h5 className="mb-1 font-medium text-neutral-900 text-sm dark:text-white">Dental Care Tips for Sensitive Teeth</h5>
                        <p className="text-neutral-600 text-xs dark:text-neutral-400">Goal: 8,000 impressions per month</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "chat" && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-[340px] p-4 sm:h-[380px] sm:p-6"
                  >
                    <div className="mb-4">
                      <h4 className="font-serif text-lg text-neutral-900 sm:text-xl dark:text-white">Chat</h4>
                      <p className="text-neutral-500 text-xs sm:text-sm dark:text-neutral-400">Ask anything about your SEO performance</p>
                    </div>
                    <div className="space-y-3">
                      {/* User message */}
                      <div className="flex justify-end">
                        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-neutral-100 px-4 py-2 text-neutral-700 text-sm dark:bg-neutral-700 dark:text-neutral-200">
                          How has performance been this last week compared to the previous week, and why?
                        </div>
                      </div>
                      {/* AI response */}
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-neutral-100 px-4 py-3 text-neutral-700 text-sm dark:bg-neutral-800 dark:text-neutral-200">
                          <p className="mb-2">Great question! This week showed a <span className="font-semibold text-emerald-600 dark:text-emerald-400">23% increase</span> in impressions compared to last week.</p>
                          <p className="mb-2">The main driver was your article &quot;Best Electric Toothbrush 2025&quot; which gained traction on Google&apos;s featured snippets...</p>
                          <p className="text-neutral-400 dark:text-neutral-500">.....</p>
                        </div>
                      </div>
                    </div>
                    {/* Input bar */}
                    <div className="mt-4 flex items-center gap-2 rounded-xl border-2 border-neutral-300 bg-neutral-50 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800">
                      <input type="text" placeholder="Ask about your performance..." className="flex-1 bg-transparent text-neutral-600 text-sm outline-none dark:text-neutral-300 dark:placeholder:text-neutral-500" readOnly />
                      <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Feature list - grouped with icons */}
          <div className="space-y-5 sm:space-y-6">
            {featureGroups.map((group) => (
              <div key={group.title} className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-200 sm:h-10 sm:w-10 dark:bg-emerald-200/20 dark:backdrop-blur-sm">
                  <group.icon className="h-5 w-5 text-emerald-700 sm:h-5 sm:w-5 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm tracking-[-0.01em] sm:text-base dark:text-white">{group.title}</h3>
                  {group.desc && (
                    <p className="mt-1 text-neutral-800 text-xs leading-relaxed sm:text-sm dark:text-white">{group.desc}</p>
                  )}
                  {group.items && (
                    <ul className="mt-2 space-y-1">
                      {group.items.map((item) => (
                        <li key={item} className="text-neutral-800 text-xs sm:text-sm dark:text-white">• {item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FLUID POSTS LOGO COMPONENT
// ============================================

function FluidPostsLogo({ className, centered }: { className?: string; centered?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${centered ? "justify-center" : ""} ${className}`}>
      <Logo className="h-6 w-6" />
      <span className="font-serif text-sm tracking-[-0.01em]">Fluid Posts</span>
    </div>
  );
}

// ============================================
// PRICING - COMPARISON SECTION
// ============================================

function PricingSection() {
  return (
    <section className="relative overflow-hidden bg-emerald-50 py-16 sm:py-24 dark:bg-neutral-900">
      {/* Dot pattern - same as Real Results */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.22]">
        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <pattern id="pricing-dots" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="25" r="1.5" fill="currentColor" className="text-emerald-600" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pricing-dots)" />
        </svg>
      </div>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center sm:mb-16">
          <h2 className="mb-3 font-light font-serif text-[28px] text-neutral-900 leading-[1.1] tracking-[-0.02em] sm:text-[36px] md:text-[48px] dark:text-white">
            Pricing<span className="text-emerald-600">.</span>
          </h2>
          <p className="mx-auto mb-6 max-w-2xl text-base text-neutral-600 sm:text-lg dark:text-neutral-300">
            We believe SEO should be accessible to businesses of all sizes. That&apos;s why we&apos;re priced competitively—a fraction of traditional agencies, with better results.
          </p>
          <div className="mx-auto h-0.5 w-16 bg-emerald-600 dark:bg-emerald-400" />
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Traditional Agency */}
          <div className="flex flex-col rounded-2xl border-2 border-neutral-300 bg-white p-6 sm:p-8 dark:border-neutral-600 dark:bg-neutral-800">
            {/* Header section - price aligned with other cards */}
            <div className="mb-6 flex min-h-[120px] flex-col justify-end text-center">
              <div className="mb-4 min-h-[3.5rem]">
                <h3 className="font-serif text-neutral-900 italic tracking-[-0.01em] dark:text-white">Traditional SEO Agency</h3>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-serif text-2xl text-neutral-900 sm:text-3xl dark:text-white">$3,000-$10,000</span>
                <span className="text-neutral-500 dark:text-neutral-400">/mo</span>
              </div>
            </div>

            {/* Features section */}
            <div className="flex-1">
              <p className="mb-3 font-medium text-neutral-700 text-sm dark:text-neutral-300">What you get:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-neutral-600 text-xs sm:text-sm dark:text-neutral-400">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>3-4 Articles / month</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-600 text-xs sm:text-sm dark:text-neutral-400">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>6-12 month lock-in period</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-600 text-xs sm:text-sm dark:text-neutral-400">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Monthly Reporting</span>
                </li>
              </ul>
              
              <p className="mt-6 mb-3 font-medium text-red-600 text-sm dark:text-red-400">What you don&apos;t get:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-neutral-500 text-xs sm:text-sm dark:text-neutral-400">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Real-time traffic updates</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-500 text-xs sm:text-sm dark:text-neutral-400">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Search strategy</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-500 text-xs sm:text-sm dark:text-neutral-400">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Transparent Self-auditing</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Fluid Posts - HIGHLIGHTED */}
          <div className="relative flex flex-col rounded-2xl border-2 border-emerald-500 bg-white p-6 sm:p-8 dark:bg-neutral-800">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-600 px-3 py-1 font-medium text-[10px] text-white sm:px-4 sm:text-xs">
              BEST FOR SMALL BUSINESSES
            </div>
            {/* Header section - price aligned with other cards */}
            <div className="mb-6 flex min-h-[120px] flex-col justify-end text-center">
              <div className="mb-4 flex min-h-[3.5rem] items-center justify-center">
                <FluidPostsLogo className="text-neutral-900 dark:text-white" centered />
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-serif text-4xl text-neutral-900 sm:text-5xl dark:text-white">$99</span>
                <span className="text-neutral-500 dark:text-neutral-400">/mo</span>
              </div>
              <div className="mt-2 flex flex-col items-center gap-1">
                <span className="text-lg text-neutral-400 line-through">$199/mo</span>
                <span className="inline-block rounded-full bg-amber-400 px-4 py-1.5 font-bold text-amber-900 text-sm">50% OFF</span>
              </div>
            </div>

            {/* Features section */}
            <div className="flex-1">
              <p className="mb-3 font-medium text-neutral-700 text-sm dark:text-neutral-300">What you get:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-neutral-700 text-xs sm:text-sm dark:text-neutral-300">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>5 GEO/SEO-optimized articles/month</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700 text-xs sm:text-sm dark:text-neutral-300">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>1 quality backlink/month</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700 text-xs sm:text-sm dark:text-neutral-300">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Clear strategies upon onboarding</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700 text-xs sm:text-sm dark:text-neutral-300">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Self-auditing platform</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700 text-xs sm:text-sm dark:text-neutral-300">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Automated CMS publishing</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700 text-xs sm:text-sm dark:text-neutral-300">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Control over published content</span>
                </li>
              </ul>
            </div>

            <WaitListDialog
              trigger={
                <button
                  type="button"
                  className="mt-6 w-full rounded-full bg-emerald-600 py-3 font-medium text-white transition-all hover:bg-emerald-700"
                >
                  Join the waitlist
                </button>
              }
            />
          </div>

          {/* Enterprise - HIGHLIGHTED */}
          <div className="relative flex flex-col rounded-2xl border-2 border-blue-500 bg-white p-6 sm:p-8 dark:bg-neutral-800">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-3 py-1 font-medium text-[10px] text-white sm:px-4 sm:text-xs">
              BEST FOR ENTERPRISES
            </div>
            {/* Header section - price aligned with other cards */}
            <div className="mb-6 flex min-h-[120px] flex-col justify-end text-center">
              <div className="mb-4 flex min-h-[3.5rem] items-center justify-center gap-2">
                <Logo className="h-6 w-6" />
                <span className="font-serif text-neutral-900 tracking-[-0.01em] dark:text-white">Fluid Posts Enterprise</span>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-serif text-3xl text-neutral-900 sm:text-4xl dark:text-white">Custom</span>
              </div>
              <p className="mt-2 text-neutral-600 text-xs sm:text-sm dark:text-neutral-400">Accelerated results for serious growth</p>
            </div>

            {/* Features section */}
            <div className="flex-1">
              <p className="mb-3 font-medium text-neutral-700 text-sm dark:text-neutral-300">What you get:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-neutral-700 text-xs sm:text-sm dark:text-neutral-300">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>30+ SEO-optimized articles/month</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700 text-xs sm:text-sm dark:text-neutral-300">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>3+ quality backlinks/month</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700 text-xs sm:text-sm dark:text-neutral-300">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Direct contact with founders</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700 text-xs sm:text-sm dark:text-neutral-300">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Personalized onboarding</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700 text-xs sm:text-sm dark:text-neutral-300">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Quicker results</span>
                </li>
              </ul>
            </div>

            <WaitListDialog
              trigger={
                <button
                  type="button"
                  className="mt-6 w-full rounded-full bg-emerald-600 py-3 font-medium text-white transition-all hover:bg-emerald-700"
                >
                  Join the waitlist
                </button>
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// CTA SECTION
// ============================================

function CTASection() {
  return (
    <section className="relative overflow-hidden bg-emerald-600 py-16 sm:py-24 dark:bg-emerald-800">
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="mb-4 font-light font-serif text-[28px] text-white leading-[1.1] tracking-[-0.02em] sm:text-[36px] md:text-[52px]">
          Let&apos;s Get Ranking<span className="text-emerald-200 dark:text-emerald-300">.</span>
        </h2>
        <p className="mx-auto mb-6 max-w-xl text-base text-emerald-100 sm:text-lg">
          Unlock the value of SEO for your business today, and watch visibility compound while you sit and watch<span className="text-emerald-200 dark:text-emerald-300">.</span>
        </p>
        <div className="mx-auto mb-8 h-0.5 w-16 bg-emerald-200 dark:bg-emerald-300" />
        <WaitListDialog
          trigger={
            <button
              type="button"
              className="w-full rounded-full bg-white px-8 py-4 font-medium text-emerald-700 transition-all hover:bg-emerald-50 sm:w-auto sm:px-12 dark:bg-emerald-50 dark:hover:bg-white"
            >
              Join the waitlist
            </button>
          }
        />
      </div>
    </section>
  );
}

// ============================================
// MAIN APP
// ============================================

function App() {
  return (
    <main className="relative">
      <LiquidGradientBackground />
      <SerpClimbDemo />
      <SocialProofSection />
      <JourneySection />
      <ResultsSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
    </main>
  );
}
