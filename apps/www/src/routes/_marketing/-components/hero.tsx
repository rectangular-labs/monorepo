import { InteractiveGridPattern } from "@rectangular-labs/ui/components/background/interactive-grid-pattern";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const InteractiveRectangle = lazy(() => import("./interactive-rectangle"));

export function Hero() {
  return (
    <Section className="relative text-center">
      <h1 className="font-bold text-4xl tracking-tight [text-wrap:balance] md:text-6xl">
        Bootstrapped, customer-obsessed software ventures
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground [text-wrap:balance] md:text-xl">
        We conceive, build, and operate high-craft products — shipped fast,
        built to last.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/docs">Read the Docs</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/blog">Read the Lab Notes</Link>
        </Button>
      </div>

      <div
        aria-hidden
        className="relative mt-12 h-80 overflow-hidden rounded-lg border p-4 md:h-96 md:p-6"
      >
        <InteractiveGridPattern
          height={24}
          interactive={false}
          squares={[60, 20]}
          width={24}
        />
        <Suspense fallback={null}>
          <InteractiveRectangle />
        </Suspense>
      </div>
    </Section>
  );
}

export default Hero;
