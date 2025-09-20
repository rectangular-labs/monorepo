import { MoveRight, PhoneCall } from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";

export const Hero = () => (
  <Section>
    <div className="container mx-auto">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div>
            <Badge variant="outline">Private beta</Badge>
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="max-w-lg text-left font-regular text-5xl tracking-tighter md:text-7xl">
              The AI SEO employee
            </h1>
            <p className="max-w-md text-left text-muted-foreground text-xl leading-relaxed tracking-tight">
              Onboard once. Your SEO is understood, planned by intent,
              forecasted with ranges, and scheduled to ship—automatically.
            </p>
          </div>
          <div className="flex flex-row gap-4">
            <Button className="gap-4" size="lg">
              Start free <MoveRight className="h-4 w-4" />
            </Button>
            <Button className="gap-4" size="lg" variant="outline">
              Talk to sales <PhoneCall className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="aspect-square rounded-md bg-muted"></div>
      </div>
    </div>
  </Section>
);
