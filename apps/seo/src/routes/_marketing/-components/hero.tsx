import { CrowdCanvas } from "@rectangular-labs/ui/components/background/crowd";
import { MoveRight } from "@rectangular-labs/ui/components/icon";
import { buttonVariants } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

export const Hero = () => {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(() => ["website traffic?", "leads?", "sales?"], []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
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
              <span>Are you ready to get more</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pt-1 md:pb-4">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                    className="absolute font-semibold"
                    initial={{ opacity: 0, y: "-100" }}
                    key={title}
                    transition={{ type: "spring", stiffness: 50 }}
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="z-10 max-w-2xl text-center text-lg text-muted-foreground leading-relaxed tracking-tight md:text-xl">
              Answer 16 questions to get a simple personalized plan to get more
              traffic.
            </p>
          </div>
          <div className="flex flex-row gap-3">
            <Link
              className={buttonVariants({
                className: "z-10 gap-4",
                size: "lg",
              })}
              to="/quiz"
            >
              Get your plan now <MoveRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Section>
      <CrowdCanvas className="z-0" cols={7} rows={15} src="/peeps.png" />
    </div>
  );
};
