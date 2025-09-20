import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { Link } from "@tanstack/react-router";

export function CTA() {
  return (
    <Section className="content-vis-auto">
      <div className="relative overflow-hidden rounded-lg border bg-muted p-8 text-center md:p-12">
        <h2 className="font-semibold text-3xl tracking-tight md:text-4xl">
          Hire the AI SEO employee
        </h2>
        <p className="mt-2 text-muted-foreground">
          Understand. Plan. Forecast. Ship. All in one place.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <a href="#pricing">Start free</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/blog">See how it works</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
