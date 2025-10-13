import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { useNavigate } from "@tanstack/react-router";

export const Hero = () => {
  const navigate = useNavigate();
  return (
    <Section>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div>
              <Badge variant="outline">1k Challenge</Badge>
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="max-w-xl text-left font-regular text-4xl tracking-tighter md:text-6xl">
                Stuck on page 2?
                <br />
                Get 1,000 more visits in 60 days.
              </h1>
              <p className="max-w-xl text-left text-muted-foreground text-xl leading-relaxed tracking-tight">
                The 1k Challenge: 1,000 more monthly organic visits within 60
                days for $1,000 or your money back.
                <br />
                Take our 3 minute quiz to see your biggest wins.
              </p>
            </div>
            <div className="flex flex-row gap-4">
              <Button onClick={() => navigate({ to: "/quiz" })} size="lg">
                Get more traffic now
              </Button>
            </div>
          </div>
          <div className="aspect-square overflow-hidden rounded-md bg-muted">
            <img
              alt="SEO growth hero"
              className="h-full w-full object-cover"
              src="/hero-image.png"
            />
          </div>
        </div>
      </div>
    </Section>
  );
};
