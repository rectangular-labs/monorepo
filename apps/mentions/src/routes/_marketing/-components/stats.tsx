import {
  ArrowRight,
  MoveDownLeft,
  MoveUpRight,
} from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Section } from "@rectangular-labs/ui/components/ui/section";

export const Stats = () => (
  <Section id="how-it-works">
    <div className="container mx-auto">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-4">
          <div>
            <Badge>How it Works</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-left font-regular text-xl tracking-tighter md:text-5xl lg:max-w-xl">
              Choose keywords
              <span className="flex items-center gap-2">
                <ArrowRight /> We find perfect posts
              </span>
              <span className="flex items-center gap-2">
                <ArrowRight /> You review drafts
              </span>
            </h2>
            <p className="text-left text-lg text-muted-foreground leading-relaxed tracking-tight lg:max-w-sm">
              While you do more important things, we monitor the web 24/7, pick
              high-quality, relevant posts, and write helpful replies that
              mention your product when it genuinely fits.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="grid w-full grid-cols-1 gap-2 text-left sm:grid-cols-2 lg:grid-cols-2">
            <div className="flex flex-col justify-between gap-0 rounded-md border p-6">
              <MoveUpRight className="mb-10 h-4 w-4 text-primary" />
              <h2 className="flex max-w-xl flex-row items-end gap-4 text-left font-regular text-4xl tracking-tighter">
                30–60
                <span className="text-muted-foreground text-sm tracking-normal">
                  hrs saved/mo
                </span>
              </h2>
              <p className="max-w-xl text-left text-base text-muted-foreground leading-relaxed tracking-tight">
                Per project compared to manual monitoring
              </p>
            </div>
            <div className="flex flex-col justify-between gap-0 rounded-md border p-6">
              <MoveDownLeft className="mb-10 h-4 w-4 text-destructive" />
              <h2 className="flex max-w-xl flex-row items-end gap-4 text-left font-regular text-4xl tracking-tighter">
                1–2
                <span className="text-muted-foreground text-sm tracking-normal">
                  weeks
                </span>
              </h2>
              <p className="max-w-xl text-left text-base text-muted-foreground leading-relaxed tracking-tight">
                Typical time to first results
              </p>
            </div>
            <div className="flex flex-col justify-between gap-0 rounded-md border p-6">
              <MoveUpRight className="mb-10 h-4 w-4 text-primary" />
              <h2 className="flex max-w-xl flex-row items-end gap-4 text-left font-regular text-4xl tracking-tighter">
                24/7
                <span className="text-muted-foreground text-sm tracking-normal">
                  coverage
                </span>
              </h2>
              <p className="max-w-xl text-left text-base text-muted-foreground leading-relaxed tracking-tight">
                We watch so you don’t have to
              </p>
            </div>
            <div className="flex flex-col justify-between gap-0 rounded-md border p-6">
              <MoveUpRight className="mb-10 h-4 w-4 text-primary" />
              <h2 className="flex max-w-xl flex-row items-end gap-4 text-left font-regular text-4xl tracking-tighter">
                0
                <span className="text-muted-foreground text-sm tracking-normal">
                  spam
                </span>
              </h2>
              <p className="max-w-xl text-left text-base text-muted-foreground leading-relaxed tracking-tight">
                Helpful replies only, tailored to the post
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Section>
);
