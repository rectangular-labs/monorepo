import { Check } from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Section } from "@rectangular-labs/ui/components/ui/section";

export function Benefits() {
  const items = [
    {
      title: "Personalized score",
      desc: "Know instantly where your current site stands. This provides you an anchor to help you track your progress.",
    },
    {
      title: "3 actionable insights",
      desc: "We'll help identify the biggest opportunities that you can act on to grow your traffic today.",
    },
    {
      title: "Understand why",
      desc: "We'll explain why each opportunity is important.",
    },
    {
      title: "Chance to work with us",
      desc: "For select teams, we'll execute alongside you to drive results.",
    },
  ];

  return (
    <Section id="forecast">
      <div className="container mx-auto">
        <div className="flex flex-col items-start gap-4">
          <div>
            <Badge variant="outline">Benefits</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="max-w-xl text-left font-regular text-3xl tracking-tighter md:text-5xl">
              What do you get?
            </h2>
            <p className="max-w-xl text-left text-lg text-muted-foreground leading-relaxed tracking-tight lg:max-w-lg">
              There's a lot of advice out there. We're here to help you cut
              through the noise and start making progress now.
            </p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div className="flex items-start gap-4" key={item.title}>
              <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
