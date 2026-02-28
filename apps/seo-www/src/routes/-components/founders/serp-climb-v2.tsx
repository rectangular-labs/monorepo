import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { WaitListDialog } from "../waitlist-dialog";

const ROW_H = 96;
const VISIBLE_ROWS = 3;
const VIEWPORT_H = ROW_H * VISIBLE_ROWS;

const CLIMB_DURATION = 1.6;
const HOLD_START_MS = 800;
const HOLD_TOP_MS = 200;
const CURSOR_MOVE_DURATION = 0.18;
const CURSOR_HOLD_MS = 350;
const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const TRANSITION_DELAY = 250;
const GRAPHIC_HEIGHT = 520;

// ============================================
// GOOGLE SERP COMPONENT
// ============================================

function GoogleLogo() {
  return (
    <svg aria-label="Google" className="h-8 w-auto" viewBox="0 0 272 92">
      <path
        d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"
        fill="#EA4335"
      />
      <path
        d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"
        fill="#FBBC05"
      />
      <path
        d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"
        fill="#4285F4"
      />
      <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853" />
      <path
        d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"
        fill="#EA4335"
      />
      <path
        d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"
        fill="#4285F4"
      />
    </svg>
  );
}

function SearchBar({ query }: { query: string }) {
  return (
    <div className="flex items-center rounded-full border border-neutral-200 bg-white px-5 py-3">
      <svg
        aria-label="Search"
        className="mr-4 h-5 w-5 text-neutral-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      </svg>
      <span className="text-base text-neutral-800">{query}</span>
    </div>
  );
}

function SerpResultRow({
  name,
  url,
  snippet,
  isBrand,
  isBlurred,
  isAtTop,
  isClicked,
}: {
  name: string;
  url: string;
  snippet: string;
  isBrand?: boolean;
  isBlurred: boolean;
  isAtTop?: boolean;
  isClicked?: boolean;
}) {
  return (
    <motion.div
      animate={{
        filter: isBrand ? "blur(0px)" : isBlurred ? "blur(2px)" : "blur(0px)",
        opacity: isBrand ? 1 : isBlurred ? 0.3 : 0.55,
      }}
      className="relative px-6 py-5"
      style={{ height: ROW_H }}
      transition={{ duration: 0.25 }}
    >
      {isBrand && (
        <motion.div
          animate={{
            opacity: 1,
            background: isAtTop
              ? "linear-gradient(90deg, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0.04) 100%)"
              : "linear-gradient(90deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.02) 100%)",
            boxShadow: isAtTop
              ? "0 0 40px rgba(59,130,246,0.3)"
              : "0 0 20px rgba(59,130,246,0.15)",
          }}
          className="absolute inset-x-4 inset-y-2 -z-10 rounded-xl"
          transition={{ duration: 0.3 }}
        />
      )}
      <div
        className={`mb-1.5 text-xs ${isBrand ? "font-medium text-neutral-700 dark:text-neutral-300" : "text-neutral-500 dark:text-neutral-400"}`}
      >
        {url}
      </div>
      <motion.div
        animate={{ textDecoration: isClicked ? "underline" : "none" }}
        className={`text-[15px] ${isBrand ? "font-semibold" : ""}`}
        transition={{ duration: 0.15 }}
      >
        <span
          className={
            isClicked
              ? "text-purple-600 dark:text-purple-400"
              : "text-[#1a0dab] dark:text-blue-300"
          }
        >
          {name}
        </span>
      </motion.div>
      <div
        className={`mt-2 text-xs leading-relaxed ${isBrand ? "text-neutral-600 dark:text-neutral-300" : "text-neutral-500 dark:text-neutral-400"}`}
      >
        {snippet}
      </div>
    </motion.div>
  );
}

function MouseCursor({
  isVisible,
  isClicking,
}: {
  isVisible: boolean;
  isClicking: boolean;
}) {
  return (
    <motion.div
      animate={{
        opacity: isVisible ? 1 : 0,
        x: isVisible ? 140 : 350,
        y: isVisible ? 40 : 120,
        scale: isClicking ? 0.9 : 1,
      }}
      className="pointer-events-none absolute z-30"
      initial={{ opacity: 0, x: 350, y: 120 }}
      transition={{
        duration: isVisible ? CURSOR_MOVE_DURATION : 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <svg
        aria-label="Cursor"
        fill="none"
        height="28"
        viewBox="0 0 24 24"
        width="28"
      >
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z"
          fill="#fff"
          stroke="#000"
          strokeWidth="1.5"
        />
      </svg>
    </motion.div>
  );
}

function GoogleSerpGraphic({ onComplete }: { onComplete: () => void }) {
  const competitorControls = useAnimationControls();
  const brandControls = useAnimationControls();
  const [phase, setPhase] = useState<
    "idle" | "climbing" | "top" | "cursor" | "click"
  >("idle");

  const competitors = [
    {
      id: "c1",
      name: "Competitor 1 — Industry Solutions",
      url: "competitor1.com",
      snippet: "Professional services for your business...",
    },
    {
      id: "c2",
      name: "Competitor 2 — Industry Solutions",
      url: "competitor2.com",
      snippet: "Professional services for your business...",
    },
    {
      id: "c3",
      name: "Competitor 3 — Industry Solutions",
      url: "competitor3.com",
      snippet: "Professional services for your business...",
    },
    {
      id: "c4",
      name: "Competitor 4 — Industry Solutions",
      url: "competitor4.com",
      snippet: "Professional services for your business...",
    },
    {
      id: "c5",
      name: "Competitor 5 — Industry Solutions",
      url: "competitor5.com",
      snippet: "Professional services for your business...",
    },
    {
      id: "c6",
      name: "Competitor 6 — Industry Solutions",
      url: "competitor6.com",
      snippet: "Professional services for your business...",
    },
    {
      id: "c7",
      name: "Competitor 7 — Industry Solutions",
      url: "competitor7.com",
      snippet: "Professional services for your business...",
    },
    {
      id: "c8",
      name: "Competitor 8 — Industry Solutions",
      url: "competitor8.com",
      snippet: "Professional services for your business...",
    },
    {
      id: "c9",
      name: "Competitor 9 — Industry Solutions",
      url: "competitor9.com",
      snippet: "Professional services for your business...",
    },
  ];

  const competitorStartY = -ROW_H * (competitors.length - 2);
  const competitorEndY = ROW_H;
  const brandStartY = ROW_H * 2;
  const brandEndY = 0;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      setPhase("idle");
      competitorControls.set({ y: competitorStartY });
      brandControls.set({ y: brandStartY });

      await new Promise((r) => setTimeout(r, HOLD_START_MS));
      if (cancelled) return;
      setPhase("climbing");

      await Promise.all([
        brandControls.start({
          y: brandEndY,
          transition: { duration: CLIMB_DURATION, ease: EASE },
        }),
        competitorControls.start({
          y: competitorEndY,
          transition: { duration: CLIMB_DURATION, ease: EASE },
        }),
      ]);
      if (cancelled) return;
      setPhase("top");

      await new Promise((r) => setTimeout(r, HOLD_TOP_MS));
      if (cancelled) return;
      setPhase("cursor");

      await new Promise((r) => setTimeout(r, CURSOR_MOVE_DURATION * 1000 + 80));
      if (cancelled) return;
      setPhase("click");

      await new Promise((r) => setTimeout(r, CURSOR_HOLD_MS));
      if (cancelled) return;
      onComplete();
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [
    competitorControls,
    brandControls,
    competitorStartY,
    brandStartY,
    onComplete,
  ]);

  const isClimbing = phase === "climbing";
  const isAtTop = phase === "top" || phase === "cursor" || phase === "click";
  const showCursor = phase === "cursor" || phase === "click";
  const isClicked = phase === "click";

  return (
    <div
      className="flex w-[640px] max-w-[95vw] items-start"
      style={{ minHeight: GRAPHIC_HEIGHT }}
    >
      <div className="relative w-full overflow-hidden rounded-3xl border-2 border-neutral-400 bg-white dark:border-neutral-600 dark:bg-neutral-800">
        <div className="border-neutral-100 border-b bg-white px-6 pt-6 pb-4 dark:border-neutral-700 dark:bg-neutral-800">
          <GoogleLogo />
          <div className="mt-5">
            <SearchBar query="best product for my needs" />
          </div>
          <div className="mt-5 flex items-center gap-6 text-neutral-500 text-sm">
            <span className="-mb-px border-[#4285f4] border-b-[3px] pb-3 font-medium text-neutral-800 dark:text-white">
              All
            </span>
            <span className="pb-3">Images</span>
            <span className="pb-3">Videos</span>
            <span className="pb-3">News</span>
          </div>
        </div>
        <div
          className="relative overflow-hidden bg-white dark:bg-neutral-800"
          style={{ height: VIEWPORT_H }}
        >
          <motion.div
            animate={competitorControls}
            className="absolute inset-x-0 top-0"
            initial={{ y: competitorStartY }}
            style={{ willChange: "transform" }}
          >
            {competitors.map((c) => (
              <SerpResultRow
                isBlurred={isClimbing}
                isBrand={false}
                key={c.id}
                name={c.name}
                snippet={c.snippet}
                url={c.url}
              />
            ))}
          </motion.div>
          <motion.div
            animate={brandControls}
            className="absolute inset-x-0 top-0 z-10"
            initial={{ y: brandStartY }}
            style={{ willChange: "transform" }}
          >
            <SerpResultRow
              isAtTop={isAtTop}
              isBlurred={false}
              isBrand={true}
              isClicked={isClicked}
              name="Your Brand — The Best Solution"
              snippet="Discover why customers choose us..."
              url="yourbrand.com"
            />
          </motion.div>
          <MouseCursor isClicking={isClicked} isVisible={showCursor} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// GOOGLE AI OVERVIEW COMPONENT (Light mode)
// ============================================

function GeminiSparkle() {
  return (
    <svg
      aria-label="AI Overview"
      fill="none"
      height="20"
      viewBox="0 0 28 28"
      width="20"
    >
      <path
        d="M14 0C14 7.732 7.732 14 0 14c7.732 0 14 6.268 14 14 0-7.732 6.268-14 14-14-7.732 0-14-6.268-14-14Z"
        fill="url(#gemini-grad)"
      />
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="gemini-grad"
          x1="0"
          x2="28"
          y1="0"
          y2="28"
        >
          <stop stopColor="#1A73E8" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AIOverviewGraphic({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<
    "idle" | "thinking" | "typing" | "highlight" | "done"
  >("idle");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      setPhase("idle");
      await new Promise((r) => setTimeout(r, 300));
      if (cancelled) return;
      setPhase("thinking");
      await new Promise((r) => setTimeout(r, 800));
      if (cancelled) return;
      setPhase("typing");
      await new Promise((r) => setTimeout(r, 600));
      if (cancelled) return;
      setPhase("highlight");
      await new Promise((r) => setTimeout(r, 1200));
      if (cancelled) return;
      setPhase("done");
      await new Promise((r) => setTimeout(r, 500));
      if (cancelled) return;
      onComplete();
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [onComplete]);

  const isThinking = phase === "thinking";
  const showText =
    phase === "typing" || phase === "highlight" || phase === "done";
  const highlightBrand = phase === "highlight" || phase === "done";

  return (
    <div
      className="flex w-[640px] max-w-[95vw] items-start"
      style={{ minHeight: GRAPHIC_HEIGHT }}
    >
      <div className="relative w-full overflow-hidden rounded-3xl border-2 border-neutral-400 bg-white dark:border-neutral-600 dark:bg-neutral-800">
        {/* Header */}
        <div className="flex items-center gap-2.5 border-neutral-100 border-b px-6 pt-5 pb-4 dark:border-neutral-700 dark:bg-neutral-800">
          <GeminiSparkle />
          <span className="font-medium text-[15px] text-neutral-800 dark:text-neutral-200">
            AI Overview
          </span>
          <div className="ml-auto">
            <svg
              aria-label="More"
              className="h-5 w-5 text-neutral-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[220px] px-6 py-5">
          {/* Thinking indicator */}
          <AnimatePresence>
            {isThinking && (
              <motion.div
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <GeminiSparkle />
                </motion.div>
                <span className="text-[14px] text-neutral-500 dark:text-neutral-400">
                  Thinking...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main content */}
          <AnimatePresence>
            {showText && (
              <motion.div
                animate={{ opacity: 1 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <p className="mb-4 text-[15px] text-neutral-700 leading-relaxed dark:text-neutral-300">
                  The best product for your needs is{" "}
                  <motion.span
                    animate={{
                      color: highlightBrand ? "#2563eb" : "#374151",
                      backgroundColor: highlightBrand
                        ? "rgba(59, 130, 246, 0.1)"
                        : "transparent",
                    }}
                    className="font-semibold"
                    style={{ padding: "2px 6px", borderRadius: "4px" }}
                    transition={{ duration: 0.3 }}
                  >
                    Your Brand
                  </motion.span>
                  .
                </p>

                <p className="mb-5 text-[14px] text-neutral-500 leading-relaxed dark:text-neutral-400">
                  Based on customer reviews and expert analysis,{" "}
                  <motion.span
                    animate={{ color: highlightBrand ? "#2563eb" : "#6b7280" }}
                    transition={{ duration: 0.3 }}
                  >
                    Your Brand
                  </motion.span>{" "}
                  is the top-rated solution in its category.
                </p>

                {/* Source citation inline */}
                <AnimatePresence>
                  {highlightBrand && (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-[13px] text-neutral-500 dark:text-neutral-400"
                      initial={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <svg
                        aria-label="Source"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                        />
                      </svg>
                      <span className="cursor-pointer text-blue-600 hover:underline dark:text-blue-400">
                        yourbrand.com
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CHATGPT COMPONENT (Light mode with logo)
// ============================================

function ChatGPTLogo() {
  return (
    <svg
      aria-label="ChatGPT"
      className="text-neutral-900 dark:text-white"
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
    >
      <path
        d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364l2.0201-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4091-.6813zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChatGPTGraphic({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<
    "idle" | "typing" | "show" | "sources" | "done"
  >("idle");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      setPhase("idle");
      await new Promise((r) => setTimeout(r, 400));
      if (cancelled) return;
      setPhase("typing");
      await new Promise((r) => setTimeout(r, 800));
      if (cancelled) return;
      setPhase("show");
      await new Promise((r) => setTimeout(r, 600));
      if (cancelled) return;
      setPhase("sources");
      await new Promise((r) => setTimeout(r, 1000));
      if (cancelled) return;
      setPhase("done");
      await new Promise((r) => setTimeout(r, 400));
      if (cancelled) return;
      onComplete();
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [onComplete]);

  const showResponse =
    phase === "show" || phase === "sources" || phase === "done";
  const showSources = phase === "sources" || phase === "done";

  return (
    <div
      className="flex w-[640px] max-w-[95vw] items-start"
      style={{ minHeight: GRAPHIC_HEIGHT }}
    >
      <div className="relative w-full overflow-hidden rounded-3xl border-2 border-neutral-400 bg-white dark:border-neutral-600 dark:bg-neutral-800">
        {/* Header with logo */}
        <div className="flex items-center gap-2.5 border-neutral-100 border-b px-6 pt-5 pb-4 dark:border-neutral-700">
          <ChatGPTLogo />
          <span className="font-medium text-[15px] text-neutral-800 dark:text-neutral-200">
            ChatGPT
          </span>
        </div>

        {/* Chat area */}
        <div className="min-h-[220px] px-6 py-5">
          {/* User message - pill style on right */}
          <div className="mb-5 flex justify-end">
            <div className="rounded-2xl bg-neutral-100 px-4 py-2.5 dark:bg-neutral-700">
              <p className="text-[14px] text-neutral-800 dark:text-neutral-200">
                best product for my needs
              </p>
            </div>
          </div>

          {/* Assistant response */}
          <div>
            {phase === "typing" && (
              <div className="flex items-center gap-2 py-2">
                <ChatGPTLogo />
                <div className="flex gap-1">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    className="h-1.5 w-1.5 rounded-full bg-neutral-400"
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    className="h-1.5 w-1.5 rounded-full bg-neutral-400"
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    className="h-1.5 w-1.5 rounded-full bg-neutral-400"
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
            )}

            <AnimatePresence>
              {showResponse && (
                <motion.div
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="mb-3 text-[15px] text-neutral-700 leading-relaxed dark:text-neutral-300">
                    The best product for your needs is{" "}
                    <motion.span
                      animate={{
                        color: showSources ? "#2563eb" : "#374151",
                        backgroundColor: showSources
                          ? "rgba(59, 130, 246, 0.1)"
                          : "transparent",
                      }}
                      className="font-semibold"
                      style={{ padding: "2px 6px", borderRadius: "4px" }}
                      transition={{ duration: 0.3 }}
                    >
                      Your Brand
                    </motion.span>
                    .
                  </p>

                  <AnimatePresence>
                    {showSources && (
                      <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        initial={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="mb-4 text-[14px] text-neutral-500 leading-relaxed dark:text-neutral-400">
                          It&apos;s consistently rated #1 for quality, customer
                          satisfaction, and value.
                        </p>

                        {/* Source citation */}
                        <div className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700">
                          <svg
                            aria-label="Source"
                            className="h-4 w-4 text-neutral-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                            />
                          </svg>
                          <span className="cursor-pointer text-[13px] text-blue-600 hover:underline dark:text-blue-400">
                            yourbrand.com
                          </span>
                          <svg
                            aria-label="Verified"
                            className="h-4 w-4 text-green-500 dark:text-green-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              clipRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              fillRule="evenodd"
                            />
                          </svg>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-600 dark:bg-neutral-700">
            <svg
              aria-label="Add"
              className="h-5 w-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 4v16m8-8H4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            <span className="flex-1 text-[14px] text-neutral-400">
              Message ChatGPT
            </span>
            <svg
              aria-label="Send"
              className="h-5 w-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M14 5l7 7m0 0l-7 7m7-7H3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CAROUSEL WRAPPER
// ============================================

const GRAPHICS = [
  { key: "google", label: "Google", component: GoogleSerpGraphic },
  { key: "ai-overview", label: "AI Overview", component: AIOverviewGraphic },
  { key: "chatgpt", label: "ChatGPT", component: ChatGPTGraphic },
];

export function SerpClimbDemo() {
  const [currentGraphic, setCurrentGraphic] = useState(0);

  const handleComplete = useCallback(() => {
    setTimeout(() => {
      setCurrentGraphic((prev) => (prev + 1) % GRAPHICS.length);
    }, TRANSITION_DELAY);
  }, []);

  const current = GRAPHICS[currentGraphic];
  const CurrentComponent = current?.component;

  return (
    <section className="relative min-h-[85vh] overflow-hidden pt-24 pb-12 sm:min-h-[95vh] sm:py-20">
      {/* Subtle green glow - lighter in light mode, stronger in dark mode */}
      <div className="pointer-events-none absolute inset-0">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.06)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.14)_0%,transparent_50%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.04)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.1)_0%,transparent_50%)]"
        />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="mb-4 text-center sm:mb-6">
          <span className="block font-light font-serif text-[32px] text-neutral-900 leading-[1.1] tracking-[-0.02em] sm:text-[48px] md:text-[64px] lg:text-[80px] dark:text-white">
            Take Your Brand to the
          </span>
          <span className="mt-1 block font-light font-serif text-[32px] text-neutral-900 italic leading-[1.1] tracking-[-0.02em] sm:mt-2 sm:text-[48px] md:text-[64px] lg:text-[80px] dark:text-white">
            Top of Search
            <span className="text-emerald-600 dark:text-emerald-400">.</span>
          </span>
        </h1>

        {/* Subheading and CTA */}
        <div className="mb-8 text-center sm:mb-12">
          <p className="mx-auto mb-6 max-w-2xl text-base text-neutral-600 sm:text-lg dark:text-neutral-400">
            Fluid Posts is the end-to-end SEO/GEO tool that automates organic
            rankings
            <span className="text-emerald-600 dark:text-emerald-400">.</span>
          </p>
          <WaitListDialog
            trigger={
              <button
                className="rounded-full bg-emerald-600 px-8 py-3 font-medium text-white transition-all hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                type="button"
              >
                Join the Waitlist
              </button>
            }
          />
        </div>

        <div
          className="flex justify-center overflow-hidden"
          style={{ height: GRAPHIC_HEIGHT }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full max-w-full items-start justify-center overflow-hidden"
              exit={{ opacity: 0, y: -20 }}
              initial={{ opacity: 0, y: 20 }}
              key={current?.key ?? "graphic"}
              transition={{ duration: 0.4 }}
            >
              {CurrentComponent ? (
                <CurrentComponent onComplete={handleComplete} />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tab-style indicators */}
        <div className="mt-6 flex justify-center sm:mt-10">
          <div className="inline-flex items-center gap-1 rounded-full border-2 border-neutral-300 bg-white p-1.5 dark:border-neutral-600 dark:bg-neutral-800">
            {GRAPHICS.map((g) => (
              <button
                className={`rounded-full px-3 py-1.5 font-medium text-xs transition-all duration-300 sm:px-5 sm:py-2 sm:text-sm ${
                  g.key === current?.key
                    ? "bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white"
                    : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                }`}
                key={g.key}
                onClick={() => {
                  const idx = GRAPHICS.findIndex((x) => x.key === g.key);
                  if (idx >= 0) setCurrentGraphic(idx);
                }}
                type="button"
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
