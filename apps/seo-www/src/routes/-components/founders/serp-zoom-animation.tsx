import { motion, useAnimationControls } from "motion/react";
import { useEffect, useMemo, useState } from "react";

const CARD_H = 68;
const GAP = 12;
const STEP = CARD_H + GAP;
const VIEWPORT_H = 232;

type Ghost = {
  id: string;
  urlW: "w-16" | "w-20" | "w-24";
  titleW: "w-36" | "w-40" | "w-44" | "w-48";
  dim?: boolean;
};

function SkeletonLine({ w }: { w: string }) {
  return <div className={`h-2.5 ${w} rounded bg-foreground/10`} />;
}

function GhostResult({ ghost }: { ghost: Ghost }) {
  return (
    <div
      className={[
        "h-[68px] rounded-2xl border border-border bg-background/60 px-4 py-3",
        ghost.dim ? "opacity-45" : "opacity-70",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-foreground/5">
          <div className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine w={ghost.urlW} />
          <SkeletonLine w={ghost.titleW} />
        </div>
      </div>
    </div>
  );
}

function BrandResult() {
  return (
    <div className="h-[68px] rounded-2xl border border-primary/35 bg-background/85 px-4 py-3 ring-1 ring-primary/15 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10">
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="h-2.5 w-24 rounded bg-foreground/10" />
            <div className="h-2.5 w-10 rounded bg-foreground/10" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2.5 w-16 rounded bg-foreground/10" />
            <span className="truncate font-semibold text-foreground text-sm">
              Your Brand
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function rotateDownBy<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  if (k === 0) return arr;
  return [...arr.slice(-k), ...arr.slice(0, -k)];
}

function makeGhosts(seed: number): Ghost[] {
  const urlWidths: Ghost["urlW"][] = ["w-16", "w-20", "w-24"];
  const titleWidths: Ghost["titleW"][] = ["w-36", "w-40", "w-44", "w-48"];

  return Array.from({ length: 12 }, (_, i) => ({
    id: `g-${seed}-${i}`,
    urlW: urlWidths[(seed + i) % urlWidths.length] ?? "w-20",
    titleW: titleWidths[(seed * 3 + i) % titleWidths.length] ?? "w-40",
    dim: i % 5 === 0,
  }));
}

export function SerpZoomAnimation() {
  const bgControls = useAnimationControls();
  const brandControls = useAnimationControls();
  const cutControls = useAnimationControls();
  const vignetteControls = useAnimationControls();

  const [ghosts, setGhosts] = useState<Ghost[]>(() => makeGhosts(0));
  const [boosting, setBoosting] = useState(false);

  const brandStartY = useMemo(() => VIEWPORT_H - CARD_H - 16, []);
  const brandEndY = useMemo(() => 12, []);

  useEffect(() => {
    let cancelled = false;
    const CLIMB_STEPS = 3;
    const CLIMB_BG_Y = CLIMB_STEPS * STEP;

    const run = async () => {
      let seed = 1;

      bgControls.set({ y: 0, opacity: 0.95, filter: "blur(0px)" });
      brandControls.set({ y: brandStartY, scale: 0.98 });
      cutControls.set({ opacity: 0 });
      vignetteControls.set({ opacity: 0.16 });

      while (!cancelled) {
        // Act I: start low
        setBoosting(false);
        await Promise.all([
          bgControls.start({ y: 0, transition: { duration: 0.35 } }),
          brandControls.start({
            y: brandStartY,
            scale: 0.985,
            transition: { duration: 0.35, ease: "easeOut" },
          }),
          vignetteControls.start({
            opacity: 0.14,
            transition: { duration: 0.35, ease: "easeOut" },
          }),
        ]);

        // Act II: cinematic climb
        setBoosting(true);
        await Promise.all([
          brandControls.start({
            y: brandEndY,
            scale: 1.01,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
          }),
          bgControls.start({
            y: CLIMB_BG_Y,
            opacity: 0.9,
            filter: "blur(1.5px)",
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
          }),
          vignetteControls.start({
            opacity: 0.28,
            transition: { duration: 0.28, ease: "easeOut" },
          }),
        ]);

        // Act III: settle at top
        setBoosting(false);
        await Promise.all([
          brandControls.start({
            scale: 1,
            transition: { duration: 0.18, ease: "easeOut" },
          }),
          bgControls.start({
            filter: "blur(0px)",
            opacity: 0.92,
            transition: { duration: 0.22, ease: "easeOut" },
          }),
        ]);

        // Hold
        await brandControls.start({
          y: brandEndY,
          transition: { duration: 1.0, ease: "linear" },
        });

        // Film cut to hide reset
        await cutControls.start({
          opacity: 1,
          transition: { duration: 0.12, ease: "easeIn" },
        });

        setGhosts((prev) => rotateDownBy(prev, CLIMB_STEPS));
        setGhosts(makeGhosts(seed));
        seed += 1;
        bgControls.set({ y: 0, opacity: 0.95, filter: "blur(0px)" });
        brandControls.set({ y: brandStartY, scale: 0.98 });
        vignetteControls.set({ opacity: 0.14 });

        await cutControls.start({
          opacity: 0,
          transition: { duration: 0.18, ease: "easeOut" },
        });
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    bgControls,
    brandControls,
    brandEndY,
    brandStartY,
    cutControls,
    vignetteControls,
  ]);

  const brandShadow = boosting
    ? "0 22px 50px rgba(99, 102, 241, 0.12)"
    : "0 12px 28px rgba(0,0,0,0.10)";

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-border bg-background/40 p-4 shadow-sm">
      {/* Cinematic vignette */}
      <motion.div
        aria-hidden
        animate={vignetteControls}
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 45%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.22) 100%)",
        }}
      />

      {/* Cut overlay for seamless looping */}
      <motion.div
        aria-hidden
        animate={cutControls}
        className="pointer-events-none absolute inset-0 bg-background"
        style={{ opacity: 0 }}
      />

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-background/95 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background/95 to-transparent" />

        <div
          className="relative overflow-hidden"
          style={{ height: VIEWPORT_H }}
        >
          {/* Background SERP stack (moves down) */}
          <motion.div
            animate={bgControls}
            className="flex flex-col gap-3 will-change-transform [transform:perspective(900px)_rotateX(6deg)]"
          >
            {ghosts.map((g) => (
              <div key={g.id}>
                <GhostResult ghost={g} />
              </div>
            ))}
          </motion.div>

          {/* Brand (moves from bottom to top) */}
          <motion.div
            animate={brandControls}
            className="absolute top-0 right-0 left-0 will-change-transform"
            style={{ boxShadow: brandShadow }}
          >
            <BrandResult />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
