import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type Engine = {
  id: string;
  label: string;
  node: ReactNode;
};

function ClaudeMark() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Claude</title>
      <path
        d="M12 3.2c-4.86 0-8.8 3.94-8.8 8.8s3.94 8.8 8.8 8.8c3.27 0 6.12-1.78 7.66-4.42a.9.9 0 0 0-1.56-.9A7.08 7.08 0 0 1 12 19.1a7.1 7.1 0 1 1 4.78-12.35.9.9 0 1 0 1.2-1.34A8.8 8.8 0 0 0 12 3.2Z"
        fill="currentColor"
      />
      <path
        d="M14.8 8.55a.95.95 0 0 0-1.3.28 3.2 3.2 0 1 0 0 3.34.95.95 0 0 0-1.58-1.06 1.3 1.3 0 1 1 0-1.22.95.95 0 0 0 1.3.28Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function GeminiMark() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Gemini</title>
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="geminiGradient"
          x1="2"
          x2="22"
          y1="22"
          y2="2"
        >
          <stop stopColor="#7C3AED" />
          <stop offset="0.5" stopColor="#2563EB" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.6l2.1 6.1 6.3 1.2-6.3 1.2-2.1 6.1-2.1-6.1-6.3-1.2 6.3-1.2L12 2.6Z"
        fill="url(#geminiGradient)"
      />
      <path
        d="M18.6 13.7l.95 2.75 2.85.54-2.85.54-.95 2.75-.95-2.75-2.85-.54 2.85-.54.95-2.75Z"
        fill="url(#geminiGradient)"
        opacity="0.9"
      />
    </svg>
  );
}

function AiOverviewsMark() {
  return (
    <div
      aria-hidden
      className="grid h-5 w-5 place-items-center rounded-full bg-foreground/10 font-semibold text-[10px] text-foreground"
    >
      AI
    </div>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      viewBox="0 0 256 262"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Google</title>
      <path
        d="M255.68 133.51c0-11.11-.99-19.2-3.14-27.61H130.49v50.85h71.54c-1.44 12.62-9.23 31.62-26.59 44.4l-.24 1.7 38.6 29.92 2.67.27c24.55-22.67 38.81-56.03 38.81-99.53"
        fill="#4285F4"
      />
      <path
        d="M130.49 261.1c35.09 0 64.57-11.62 86.09-31.62l-41.03-31.89c-10.97 7.62-25.7 12.92-45.06 12.92-34.37 0-63.55-22.67-74.05-54.03l-1.6.13-40.21 31.08-.55 1.53c21.38 42.7 65.24 71.88 116.41 71.88"
        fill="#34A853"
      />
      <path
        d="M56.44 156.48c-2.76-8.4-4.33-17.36-4.33-26.59 0-9.23 1.58-18.19 4.19-26.59l-.08-1.82-40.73-31.58-1.33.63C5.49 95.08 0 112.52 0 129.89c0 17.36 5.49 34.81 14.16 49.35l42.28-32.76"
        fill="#FBBC05"
      />
      <path
        d="M130.49 49.49c24.4 0 40.88 10.53 49.91 19.36l36.45-35.6C195.05 12.92 165.58 0 130.49 0 79.32 0 35.46 29.18 14.16 70.53l42.2 32.76c10.58-31.36 39.76-53.8 74.13-53.8"
        fill="#EA4335"
      />
    </svg>
  );
}

function ChatGptMark({ onError }: { onError: () => void }) {
  return (
    <img
      alt="ChatGPT"
      className="h-5 w-5"
      onError={onError}
      src="/logos/chatgpt.png"
    />
  );
}

export function HeroSearchEngineCarousel() {
  const [chatgptOk, setChatgptOk] = useState(true);
  const engines = useMemo(() => {
    const base: Engine[] = [
      { id: "google", label: "Google", node: <GoogleMark /> },
      {
        id: "chatgpt",
        label: "ChatGPT",
        node: chatgptOk ? (
          <ChatGptMark onError={() => setChatgptOk(false)} />
        ) : (
          <div className="grid h-5 w-5 place-items-center rounded-full bg-foreground/10 font-semibold text-[10px] text-foreground">
            GPT
          </div>
        ),
      },
      { id: "aio", label: "AI Overviews", node: <AiOverviewsMark /> },
      { id: "claude", label: "Claude", node: <ClaudeMark /> },
      { id: "gemini", label: "Gemini", node: <GeminiMark /> },
    ];
    return base;
  }, [chatgptOk]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (engines.length === 0) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % engines.length);
    }, 1000);
    return () => window.clearInterval(id);
  }, [engines.length]);

  const active = engines[index] ?? engines[0];
  if (!active) return null;

  return (
    <span className="inline-flex translate-y-[2px] items-center justify-center">
      <span className="relative inline-grid h-10 w-10 place-items-center rounded-2xl border border-border bg-background/70 shadow-sm">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            className="inline-grid place-items-center"
            exit={{ opacity: 0, rotateX: -90, y: -6 }}
            initial={{ opacity: 0, rotateX: 90, y: 6 }}
            key={active.id}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <span className="sr-only">{active.label}</span>
            {active.node}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
