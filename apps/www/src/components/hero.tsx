import { ThemeToggle } from "@rectangular-labs/ui/components/theme-provider";
import { Button } from "@rectangular-labs/ui/components/ui/button";

export function Hero() {
  return (
    <section className="section">
      <div className="container-narrow relative text-center">
        <ThemeToggle className="absolute top-0 right-0" />
        <h1 className="font-bold text-4xl tracking-tight [text-wrap:balance] md:text-6xl">
          Bootstrapped, customer‑obsessed software ventures
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground [text-wrap:balance] md:text-xl">
          We conceive, build, and operate high‑craft products — shipped fast,
          built to last.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <a href="/login">Start using our products</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="/docs">Read the Lab Notes</a>
          </Button>
        </div>

        <div aria-hidden className="grid-border mt-12 rounded-lg border p-6">
          <div className="text-muted-foreground text-sm">
            <span className="font-medium text-foreground">Terminal‑clean.</span>{" "}
            Sharp edges, fast loads, no fluff.
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
