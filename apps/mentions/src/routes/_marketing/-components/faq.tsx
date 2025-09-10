import { PhoneCall } from "@rectangular-labs/ui/components/icon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@rectangular-labs/ui/components/ui/accordion";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";

const faqs = [
  { id: "free-trial", q: "Is there a free trial?", a: "Yes, try it free." },
  {
    id: "cancel-anytime",
    q: "Can I cancel my subscription anytime?",
    a: "You can cancel any time from the dashboard.",
  },
  {
    id: "who-posts",
    q: "What accounts send the replies?",
    a: "We suggest replies. You post them from your own accounts.",
  },
  {
    id: "results",
    q: "How long to see results?",
    a: "Most users see traction within 1-2 weeks.",
  },
  { id: "projects", q: "How many projects can I run?", a: "Depends on plan." },
  {
    id: "keywords",
    q: "How many keywords can I track?",
    a: "Depends on plan.",
  },
  {
    id: "support",
    q: "Do you offer support?",
    a: "24/7 support on paid plans.",
  },
  { id: "billing", q: "Do you bill yearly?", a: "Yes, with discounts." },
];

export const FAQ1 = () => (
  <div className="w-full py-20 lg:py-40">
    <div className="container mx-auto">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <div>
              <Badge variant="outline">FAQ</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="max-w-xl text-left font-regular text-3xl tracking-tighter md:text-5xl">
                This is the start of something new
              </h4>
              <p className="max-w-xl text-left text-lg text-muted-foreground leading-relaxed tracking-tight lg:max-w-lg">
                Managing a small business today is already tough. Avoid further
                complications by ditching outdated, tedious trade methods. Our
                goal is to streamline SMB trade, making it easier and faster
                than ever.
              </p>
            </div>
            <div className="">
              <Button className="gap-4" variant="outline">
                Any questions? Reach out <PhoneCall className="h-4 w-4" />
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
  </div>
);
