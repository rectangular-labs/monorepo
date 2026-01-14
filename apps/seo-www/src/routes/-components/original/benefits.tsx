import { Check } from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { ONBOARD_LINK } from "../constants";

export function Benefits() {
  const items = [
    {
      title: "Keyword analysis",
      desc: "We analyze the keywords that matter for your domain so you can capture qualified demand.",
    },
    {
      title: "Content creation",
      desc: "Our agent creates on-brand content designed to rank and convert across your funnel.",
    },
    {
      title: "Results tracking",
      desc: "Track rankings and traffic automatically so you always know what's working.",
    },
    {
      title: "Personalized growth plan",
      desc: "Enter your site and get a tailored plan to grow traffic, leads, and sales.",
    },
  ];

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Benefits of Fluid Posts autonomous growth agent",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      description: item.desc,
    })),
  } as const;

  return (
    <Section aria-labelledby="benefits-heading" id="benefits">
      <div className="container mx-auto">
        <div className="flex flex-col items-start gap-4">
          <div>
            <Badge variant="outline">Benefits</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h2
              className="max-w-xl text-left font-regular text-3xl tracking-tighter md:text-5xl"
              id="benefits-heading"
            >
              What do you get?
            </h2>
            <p className="max-w-xl text-left text-lg text-muted-foreground leading-relaxed tracking-tight lg:max-w-lg">
              Get more traffic, leads, and sales with our autonomous growth
              agent. Enter your site and we&apos;ll analyze keywords, create
              content, and track results.
            </p>
          </div>
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li className="flex items-start gap-4" key={item.title}>
              <Check
                aria-hidden
                className="mt-1 h-5 w-5 flex-shrink-0 text-primary"
              />
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <p className="text-left text-muted-foreground">
            Ready to get your tailored plan? {""}
            <a
              className="underline underline-offset-4"
              href={ONBOARD_LINK}
              rel="noopener"
              target="_blank"
            >
              Onboard with us now
            </a>
            .
          </p>
        </div>
        <script type="application/ld+json">
          {JSON.stringify(itemListJsonLd)}
        </script>
      </div>
    </Section>
  );
}
