import { User } from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Section } from "@rectangular-labs/ui/components/ui/section";

export const Feature = () => (
  <Section id="features">
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-start gap-4">
        <div>
          <Badge>What it does</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="max-w-xl text-left font-regular text-3xl tracking-tighter md:text-5xl">
            End-to-end SEO that ships itself
          </h2>
          <p className="max-w-xl text-left text-lg text-muted-foreground leading-relaxed tracking-tight lg:max-w-lg">
            Onboard once. Your AI SEO employee understands your site, plans by
            intent, forecasts ranges, and schedules to ship—automatically.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex aspect-square h-full flex-col justify-between rounded-md bg-muted p-6 lg:col-span-2 lg:aspect-auto">
          <User className="h-8 w-8 stroke-1" />
          <div className="flex flex-col">
            <h3 className="text-xl tracking-tight">Campaign briefs</h3>
            <p className="max-w-xs text-base text-muted-foreground">
              Ready-to-write briefs with outlines, keywords, internal links, and
              intent notes.
            </p>
          </div>
        </div>
        <div className="flex aspect-square flex-col justify-between rounded-md bg-muted p-6">
          <User className="h-8 w-8 stroke-1" />
          <div className="flex flex-col">
            <h3 className="text-xl tracking-tight">Keyword clusters</h3>
            <p className="max-w-xs text-base text-muted-foreground">
              Opportunity mapping by user intent and difficulty across the
              funnel.
            </p>
          </div>
        </div>

        <div className="flex aspect-square flex-col justify-between rounded-md bg-muted p-6">
          <User className="h-8 w-8 stroke-1" />
          <div className="flex flex-col">
            <h3 className="text-xl tracking-tight">Forecasts</h3>
            <p className="max-w-xs text-base text-muted-foreground">
              Time-to-rank and traffic lift ranges with confidence bands.
            </p>
          </div>
        </div>
        <div className="flex aspect-square h-full flex-col justify-between rounded-md bg-muted p-6 lg:col-span-2 lg:aspect-auto">
          <User className="h-8 w-8 stroke-1" />
          <div className="flex flex-col">
            <h3 className="text-xl tracking-tight">Content calendar</h3>
            <p className="max-w-xs text-base text-muted-foreground">
              Auto-scheduling with reminders, so campaigns actually ship on
              time.
            </p>
          </div>
        </div>
        <div className="flex aspect-square flex-col justify-between rounded-md bg-muted p-6">
          <User className="h-8 w-8 stroke-1" />
          <div className="flex flex-col">
            <h3 className="text-xl tracking-tight">Reporting</h3>
            <p className="max-w-xs text-base text-muted-foreground">
              Campaign-level metrics tied to intent and keyword targets.
            </p>
          </div>
        </div>
        <div className="flex aspect-square flex-col justify-between rounded-md bg-muted p-6">
          <User className="h-8 w-8 stroke-1" />
          <div className="flex flex-col">
            <h3 className="text-xl tracking-tight">Integrations</h3>
            <p className="max-w-xs text-base text-muted-foreground">
              CMS, Search Console, and Analytics to keep everything in sync.
            </p>
          </div>
        </div>
      </div>
    </div>
  </Section>
);
