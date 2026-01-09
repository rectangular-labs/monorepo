import { MoveUpRight } from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Section } from "@rectangular-labs/ui/components/ui/section";

export const Stats = () => (
  <Section aria-labelledby="stats-heading" id="how-it-works">
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <div className="flex flex-col items-start gap-4">
        <div>
          <Badge variant="outline">The Data</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <h2
            className="text-left font-regular text-xl tracking-tighter md:text-5xl lg:max-w-xl"
            id="stats-heading"
          >
            Why organic search matters for growth
          </h2>
          <p className="text-left text-lg text-muted-foreground leading-relaxed tracking-tight lg:max-w-sm">
            Get more traffic, leads, and sales. The numbers below show why
            compounding organic visibility is a powerful growth lever.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <dl className="grid w-full grid-cols-1 gap-2 text-left sm:grid-cols-2 lg:grid-cols-2">
          <div className="flex flex-col justify-between gap-0 rounded-md border p-6">
            <MoveUpRight aria-hidden className="mb-10 h-4 w-4 text-primary" />
            <dd className="flex max-w-xl flex-row items-end gap-4 text-left font-regular text-4xl tracking-tighter">
              68
              <span className="text-muted-foreground text-sm tracking-normal">
                %
              </span>
            </dd>
            <dt className="max-w-xl text-left text-base text-muted-foreground leading-relaxed tracking-tight">
              of all online experiences start with a search
            </dt>
          </div>
          <div className="flex flex-col justify-between gap-0 rounded-md border p-6">
            <MoveUpRight aria-hidden className="mb-10 h-4 w-4 text-primary" />
            <dd className="flex max-w-xl flex-row items-end gap-4 text-left font-regular text-4xl tracking-tighter">
              1,000%
              <span className="text-muted-foreground text-sm tracking-normal">
                more traffic
              </span>
            </dd>
            <dt className="max-w-xl text-left text-base text-muted-foreground leading-relaxed tracking-tight">
              from searches compared to organic social media
            </dt>
          </div>
          <div className="flex flex-col justify-between gap-0 rounded-md border p-6">
            <MoveUpRight aria-hidden className="mb-10 h-4 w-4 text-primary" />
            <dd className="flex max-w-xl flex-row items-end gap-4 text-left font-regular text-4xl tracking-tighter">
              75
              <span className="text-muted-foreground text-sm tracking-normal">
                %
              </span>
            </dd>
            <dt className="max-w-xl text-left text-base text-muted-foreground leading-relaxed tracking-tight">
              of users never scroll past page one
            </dt>
          </div>
          <div className="flex flex-col justify-between gap-0 rounded-md border p-6">
            <MoveUpRight aria-hidden className="mb-10 h-4 w-4 text-primary" />
            <dd className="flex max-w-xl flex-row items-end gap-4 text-left font-regular text-4xl tracking-tighter">
              55
              <span className="text-muted-foreground text-sm tracking-normal">
                %
              </span>
            </dd>
            <dt className="max-w-xl text-left text-base text-muted-foreground leading-relaxed tracking-tight">
              more visitors for companies that blog
            </dt>
          </div>
        </dl>
      </div>
    </div>
  </Section>
);
