import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "./-components/hero";
import { Expertise } from "./-components/expertise";
import { Reporting } from "./-components/reporting";
import { Strategy } from "./-components/strategy";
import { Writer } from "./-components/writer";
import { Judgement } from "./-components/judgement";
import { CTA } from "./-components/cta";

export const Route = createFileRoute("/_marketing/seo-experts" as any)({
  component: SEOExpertsPage,
});

function SEOExpertsPage() {
  return (
    <>
      <Hero />
      <Expertise />
      <Reporting />
      <Strategy />
      <Writer />
      <Judgement />
      <CTA />
    </>
  );
}
