import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@rectangular-labs/ui/components/ui/accordion";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { useMemo } from "react";

const faqs = [
  {
    id: "what-agent",
    q: "What is the autonomous growth agent?",
    a: "An autonomous growth agent is like a digital employee. It helps you grow organic traffic by analyzing keywords, creating content, and tracking results. All on autopilot.",
  },
  {
    id: "how-it-works",
    q: "How does it work for my site?",
    a: "Enter your domain and we'll find high-impact opportunities, generate content to rank, and monitor performance so you can track progress.",
  },
  {
    id: "what-you-get",
    q: "What do I get to start?",
    a: "Simply schedule a call with us and we'll onboard you in as little as 20 minutes.",
  },
  {
    id: "time-to-value",
    q: "How fast can I see results?",
    a: "Some improvements are visible within a few weeks depending on your baseline authority and technical health. We prioritize quick wins first. While returns aren't as quick as paid ads, they compound over time.",
  },
  {
    id: "collaboration",
    q: "Can you work with my team?",
    a: "Yes. For select teams, we will personally collaborate and can provide high touch support.",
  },
  {
    id: "cost",
    q: "Is there a cost to start?",
    a: "We have a 14 days free trial. Paid options start at $299/website/month.",
  },
];

export const FAQ = () => {
  const faqJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a,
        },
      })),
    }),
    [],
  );

  return (
    <Section aria-labelledby="faq-heading" id="faq">
      <div className="container mx-auto">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <div>
                <Badge variant="outline">FAQ</Badge>
              </div>
              <div className="flex flex-col gap-2">
                <h2
                  className="max-w-xl text-left font-regular text-3xl tracking-tighter md:text-5xl"
                  id="faq-heading"
                >
                  Everything you might want to know before you get started
                </h2>
                <p className="max-w-xl text-left text-lg text-muted-foreground leading-relaxed tracking-tight lg:max-w-lg">
                  Get more traffic, leads, and sales with our autonomous growth
                  agent. Enter your site and we&apos;ll analyze keywords, create
                  content, and track results. Still have questions? Please{" "}
                  <a className="underline" href="mailto:contact@fluidposts.com">
                    reach out
                  </a>
                  .
                </p>
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
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </div>
    </Section>
  );
};
