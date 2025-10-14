import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { Link } from "@tanstack/react-router";

export function CTA() {
  return (
    <Section className="content-vis-auto">
      <div className="relative overflow-hidden rounded-lg border bg-muted p-8 text-center md:p-12">
        <h2 className="font-semibold text-3xl tracking-tight md:text-4xl">
          Get your plan now
        </h2>
        <p className="mt-2 text-muted-foreground">
          Takes 3 minutes. Free forever. Instant results
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/quiz">Start quiz</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
