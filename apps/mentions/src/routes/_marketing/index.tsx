import { createFileRoute } from "@tanstack/react-router";
import { CTA } from "./-components/cta";
import { FAQ } from "./-components/faq";
import { Hero } from "./-components/hero";
import Pricing from "./-components/pricing";
import { Stats } from "./-components/stats";

export const Route = createFileRoute("/_marketing/")({ component: App });

function App() {
  return (
    <div className="marketing-fun-bg">
      <Hero />
      <Stats />
      <Pricing />
      <FAQ />
      <CTA />
    </div>
  );
}
