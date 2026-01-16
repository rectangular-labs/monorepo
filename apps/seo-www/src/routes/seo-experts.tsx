import { createFileRoute } from "@tanstack/react-router";
import { CTA } from "~/routes/-components/seo-experts/cta";
import { Expertise } from "~/routes/-components/seo-experts/expertise";
import { Hero } from "~/routes/-components/seo-experts/hero";
import { Judgement } from "~/routes/-components/seo-experts/judgement";
import { Reporting } from "~/routes/-components/seo-experts/reporting";
import { Strategy } from "~/routes/-components/seo-experts/strategy";
import { Writer } from "~/routes/-components/seo-experts/writer";

export const Route = createFileRoute("/seo-experts")({
  component: SEOExpertsPage,
});

function SEOExpertsPage() {
  return (
    <main className="bg-background">
      <Hero />
      <Expertise />
      <Reporting />
      <Strategy />
      <Writer />
      <Judgement />
      <CTA />
    </main>
  );
}
