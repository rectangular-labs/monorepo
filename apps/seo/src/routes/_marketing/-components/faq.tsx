import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@rectangular-labs/ui/components/ui/accordion";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Section } from "@rectangular-labs/ui/components/ui/section";

const faqs = [
  {
    id: "quiz-free",
    q: "Is the SEO quiz really free?",
    a: "Yes—it's 100% free and takes only a few minutes. No credit card required.",
  },
  {
    id: "quiz-duration",
    q: "How long does the quiz take?",
    a: "Most people finish in 3-5 minutes.",
  },
  {
    id: "quiz-results",
    q: "What do I get after the quiz?",
    a: "A shareable mini-report with target opportunities, a sample keyword universe, traffic and revenue forecast ranges, recommended content themes, and suggested internal links—tailored to your domain.",
  },
  {
    id: "quiz-catch",
    q: "What's the catch?",
    a: "No catch. We want to help you get more traffic. Our belief is that you'll eventually work with us if you need more specialized help.",
  },
  {
    id: "quiz-gsc",
    q: "Is Search Console access required?",
    a: "Nope, not at all. That said, having some statistics about your site at ready will help us give you the most accurate results.",
  },
  {
    id: "quiz-impact",
    q: "Will the quiz affect my site or rankings?",
    a: "Not at all. We rely on you to provide us with the information we need to give you the most accurate results.",
  },
  {
    id: "quiz-share",
    q: "Can I share the results with my team?",
    a: "Yes. You'll get a link you can share.",
  },
  {
    id: "quiz-multiple",
    q: "Can I run the quiz for multiple domains/times?",
    a: "Yes—run it as many times as you like for any number of domains. You can also re-run it for the same domain after you've made the changes to see how your site has improved.",
  },
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
                Everything you might want to know before you get started
              </h4>
              <p className="max-w-xl text-left text-lg text-muted-foreground leading-relaxed tracking-tight lg:max-w-lg">
                Take our free quiz to get a tailored mini-report with actionable
                insights on what you can improve. If you still have questions,
                please{" "}
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
    </div>
  </Section>
);
