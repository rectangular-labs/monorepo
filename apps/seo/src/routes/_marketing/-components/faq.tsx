import { PhoneCall } from "@rectangular-labs/ui/components/icon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@rectangular-labs/ui/components/ui/accordion";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";

const faqs = [
  {
    id: "site-understanding",
    q: "How do you understand my site?",
    a: "We crawl your site to map information architecture, parse metadata and internal links, and (optionally) connect Search Console and Analytics for richer context.",
  },
  {
    id: "content-writing",
    q: "Do you write the content?",
    a: "We deliver ready‑to‑write briefs with outlines, headings, keywords, and internal links. You can write in‑house or add our writing add‑on.",
  },
  {
    id: "forecast-accuracy",
    q: "How accurate are the forecasts?",
    a: "Forecasts are expressed as ranges with confidence bands and are recalibrated weekly as data accrues. They’re designed for planning, not guarantees.",
  },
  {
    id: "time-to-results",
    q: "How long to see results?",
    a: "Most teams see early lift within 2–6 weeks depending on domain authority, competition, and publishing cadence.",
  },
  {
    id: "integrations",
    q: "Which integrations and CMSs are supported?",
    a: "We support popular CMSs and native connections to Search Console and Analytics, with more integrations added regularly.",
  },
  {
    id: "google-updates",
    q: "What about Google updates?",
    a: "We monitor core updates and adjust campaigns and forecasts accordingly to keep you on track.",
  },
  { id: "billing", q: "Is there a free trial?", a: "Yes, start free." },
];

export const FAQ = () => (
  <Section id="faq">
    <div className="container mx-auto">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <div>
              <Badge variant="outline">FAQ</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="max-w-xl text-left font-regular text-3xl tracking-tighter md:text-5xl">
                Everything about campaigns, forecasts, and scheduling
              </h4>
              <p className="max-w-xl text-left text-lg text-muted-foreground leading-relaxed tracking-tight lg:max-w-lg">
                From site understanding to scheduled content, plan SEO with
                clarity and confidence—not guesswork.
              </p>
            </div>
            <div className="">
              <Button className="gap-4" variant="outline">
                Still have a question? Talk to us{" "}
                <PhoneCall className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <Accordion className="w-full" collapsible type="single">
          {faqs.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  </Section>
);
