import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Section } from "@rectangular-labs/ui/components/ui/section";

export function Credentials() {
  return (
    <Section aria-labelledby="credentials-heading" id="credentials">
      <div className="space-y-6">
        <div>
          <Badge variant="outline">Credentials</Badge>
        </div>
        <h2
          className="mt-2 font-semibold text-3xl tracking-tight"
          id="credentials-heading"
        >
          Why trust us?
        </h2>
      </div>

      <div className="flex h-fit w-fit items-center gap-6 rounded-md dark:my-2 dark:bg-muted">
        <img
          alt="Illustration of a person"
          className="o h-auto w-56"
          src="/peep-21.svg"
        />
        <img
          alt="Illustration of a person"
          className="-scale-x-100 h-auto w-56"
          src="/peep-47.svg"
        />
      </div>

      <div className="space-y-5 text-lg text-muted-foreground leading-relaxed">
        <p>
          We&apos;re Winston and Aaron — an engineer and a strategist who
          actually build and rank sites ourselves.
        </p>
        <p>
          Winston spent 5 years in Silicon Valley building automation systems
          for startups. Now he uses that same engineering precision to automate
          growth processes and get results fast.
        </p>
        <p>
          Aaron, trained in law at Oxford, knows how to make words rank.
          He&apos;s taken multiple pages to the top of Google through structure,
          clarity, and intent-driven writing.
        </p>
        <p>
          Together, we&apos;ve already ranked sites from 0 to 1,000+ organic
          visitors in weeks and we&apos;re applying the same system to our
          clients.
        </p>
      </div>
    </Section>
  );
}
