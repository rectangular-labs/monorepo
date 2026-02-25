import { motion, useAnimationControls } from "motion/react";
import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  isBrand?: boolean;
};

const ROW_H = 86;
const VISIBLE = 4;
const HOLD_START_MS = 180;
const HOLD_TOP_MS = 800;

const easePremium: [number, number, number, number] = [0.22, 1, 0.36, 1];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function HeroSerpClimb() {
  const controls = useAnimationControls();
  const [phase, setPhase] = useState<"idle" | "climbing" | "top">("idle");

  const rows = useMemo<Row[]>(
    () => [
      {
        id: "a",
        title: "Competitor A — SEO services",
        url: "competitor-a.com",
        snippet: "A short description of a competing offer.",
      },
      {
        id: "b",
        title: "Competitor B — Content & SEO",
        url: "competitor-b.com",
        snippet: "Another result with a calm, realistic snippet.",
      },
      {
        id: "brand",
        title: "Your brand — AI SEO that compounds",
        url: "yourbrand.com",
        snippet: "Automates strategy, writing, optimization, and publishing.",
        isBrand: true,
      },
      {
        id: "c",
        title: "Competitor C — SEO agency",
        url: "competitor-c.com",
        snippet: "A third competitor result with muted styling.",
      },
      {
        id: "d",
        title: "Competitor D — SEO tool",
        url: "competitor-d.com",
        snippet: "Yet another competitor, still muted in the UI.",
      },
      {
        id: "e",
        title: "Competitor E — Growth platform",
        url: "competitor-e.com",
        snippet: "Generic competitor snippet for realism.",
      },
    ],
    [],
  );

  const brandIndex = rows.findIndex((r) => r.isBrand);
  const startIndex = clamp(brandIndex - 2, 0, rows.length - VISIBLE);
  const topIndex = clamp(brandIndex - 0, 0, rows.length - VISIBLE);

  const startY = -(startIndex * ROW_H);
  const topY = -(topIndex * ROW_H);

  useEffect(() => {
    let cancelled = false;

    async function loop() {
      if (cancelled) return;

      setPhase("idle");
      await controls.set({ y: startY, opacity: 1 });

      await new Promise((r) => setTimeout(r, HOLD_START_MS));
      if (cancelled) return;

      setPhase("climbing");

      await controls.start({
        y: topY,
        transition: { duration: 1.35, ease: easePremium },
      });

      if (cancelled) return;
      setPhase("top");

      await new Promise((r) => setTimeout(r, HOLD_TOP_MS));
      if (cancelled) return;

      await controls.start({
        opacity: 0,
        transition: { duration: 0.16, ease: easePremium },
      });
      await controls.set({ y: startY });
      await controls.start({
        opacity: 1,
        transition: { duration: 0.12, ease: easePremium },
      });

      void loop();
    }

    void loop();
    return () => {
      cancelled = true;
    };
  }, [controls, startY, topY]);

  return (
    <section className="min-h-[90vh] w-full bg-white font-sans">
      <div className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        <h1 className="text-balance text-center font-semibold text-[44px] text-neutral-900 leading-[1.05] tracking-[-0.02em] sm:text-[56px] md:text-[72px]">
          push your brand atop search
        </h1>

        <div className="mt-10 flex justify-center">
          <div className="w-[920px] max-w-[96vw]">
            <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_40px_90px_rgba(0,0,0,0.08)]">
              {/* top bar */}
              <div className="flex items-center justify-between border-neutral-200 border-b px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100">
                    <span className="text-neutral-700">🔎</span>
                  </div>
                  <div className="font-semibold text-base text-neutral-900">
                    your brand
                  </div>
                </div>
                <div className="text-neutral-500 text-sm">
                  {phase === "climbing"
                    ? "Ranking automatically…"
                    : phase === "top"
                      ? "Rank secured."
                      : "Indexing…"}
                </div>
              </div>

              {/* viewport */}
              <div className="relative" style={{ height: ROW_H * VISIBLE }}>
                {/* cinematic vignette */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute top-0 right-0 left-0 h-10 bg-gradient-to-b from-white to-transparent" />
                  <div className="absolute right-0 bottom-0 left-0 h-10 bg-gradient-to-t from-white to-transparent" />
                </div>

                <motion.div
                  className="absolute top-0 left-0 w-full"
                  animate={controls}
                  initial={{ y: startY, opacity: 1 }}
                  style={{ willChange: "transform" }}
                >
                  {rows.map((r, idx) => {
                    const isBrand = !!r.isBrand;

                    return (
                      <div
                        key={r.id}
                        className="flex items-start gap-4 px-6"
                        style={{ height: ROW_H }}
                      >
                        {/* rank column */}
                        <div className="w-8 pt-6 text-neutral-400 text-sm tabular-nums">
                          {idx + 1}
                        </div>

                        {/* favicon */}
                        <div className="pt-7">
                          <div
                            className={[
                              "h-3.5 w-3.5 rounded-full",
                              isBrand ? "bg-neutral-900" : "bg-neutral-300",
                            ].join(" ")}
                          />
                        </div>

                        {/* content */}
                        <div className="relative flex-1 pt-4">
                          {/* brand highlight */}
                          {isBrand && (
                            <motion.div
                              className="absolute -inset-x-3 -inset-y-2 rounded-2xl"
                              animate={{
                                opacity: phase === "top" ? 1 : 0.55,
                                scale: phase === "climbing" ? 1.01 : 1,
                              }}
                              transition={{
                                duration: 0.18,
                                ease: easePremium,
                              }}
                              style={{
                                background:
                                  "linear-gradient(90deg, rgba(59,130,246,0.14), rgba(59,130,246,0.00))",
                                boxShadow:
                                  phase === "top"
                                    ? "0 0 55px rgba(59,130,246,0.20)"
                                    : "none",
                              }}
                            />
                          )}

                          <div className="relative">
                            <div
                              className={[
                                "font-semibold text-[15px]",
                                isBrand
                                  ? "text-neutral-900"
                                  : "text-neutral-500",
                              ].join(" ")}
                            >
                              {r.title}
                            </div>
                            <div
                              className={[
                                "text-xs",
                                isBrand
                                  ? "text-neutral-500"
                                  : "text-neutral-400",
                              ].join(" ")}
                            >
                              {r.url}
                            </div>
                            <div
                              className={[
                                "mt-1 text-sm leading-snug",
                                isBrand
                                  ? "text-neutral-700"
                                  : "text-neutral-400",
                              ].join(" ")}
                            >
                              {r.snippet}
                            </div>

                            {isBrand && phase === "top" && (
                              <div className="mt-2 inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-neutral-700 text-xs">
                                <span className="font-semibold">Rank #1</span>
                                <span className="mx-2 text-neutral-300">•</span>
                                <span>Compounding</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </div>

              {/* subtle footer strip */}
              <div className="flex items-center justify-between border-neutral-200 border-t px-6 py-4">
                <div className="text-neutral-500 text-xs">
                  Search results (simulated)
                </div>
                <div className="font-medium text-neutral-700 text-xs">
                  Fluid Posts
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
