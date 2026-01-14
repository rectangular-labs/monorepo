import { MoveRight } from "@rectangular-labs/ui/components/icon";
import { buttonVariants } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ONBOARD_LINK } from "../constants";

const CrowdCanvas = lazy(() =>
  import("@rectangular-labs/ui/components/background/crowd").then((m) => ({
    default: m.CrowdCanvas,
  })),
);

export const Hero = () => {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(() => ["traffic", "leads", "sales"], []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 4000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="relative min-h-screen w-full lg:min-h-[calc(100vh-70px)]">
      <Section>
        <div className="flex flex-col items-center gap-8">
          {/* <div>
            <Button className="gap-4" size="sm" variant="secondary">
              Read our launch article <MoveRight className="h-4 w-4" />
            </Button>
          </div> */}
          <div className="flex flex-col gap-4 pt-10 lg:pt-20">
            <h1 className="z-10 max-w-2xl text-center font-regular text-3xl tracking-tighter md:text-6xl">
              <span>Get more </span>
              <span className="inline-flex overflow-hidden align-bottom">
                <AnimatePresence mode="wait">
                  <motion.span
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block font-semibold"
                    exit={{ opacity: 0, y: -50 }}
                    initial={{ opacity: 0, y: 50 }}
                    key={titles[titleNumber]}
                    transition={{
                      type: "spring",
                      stiffness: 50,
                      damping: 8,
                      duration: 0.1,
                    }}
                  >
                    {titles[titleNumber]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span> with our autonomous growth agent</span>
            </h1>

            <p className="z-10 max-w-2xl text-center text-lg text-muted-foreground leading-relaxed tracking-tight md:text-xl">
              Just enter your site and we&apos;ll analyze keywords, create
              content, and track results.
            </p>
          </div>
          <div className="flex flex-row gap-3">
            <a
              className={buttonVariants({
                className: "z-10 gap-4",
                size: "lg",
              })}
              href={ONBOARD_LINK}
              rel="noopener"
              target="_blank"
            >
              Onboard with us now <MoveRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </Section>
      <Suspense fallback={null}>
        <CrowdCanvas className="z-0" cols={7} rows={15} src="/peeps.png" />
      </Suspense>
    </div>
  );
};
