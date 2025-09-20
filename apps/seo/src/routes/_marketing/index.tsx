import { createFileRoute } from "@tanstack/react-router";
import { CTA } from "./-components/cta";
import { FAQ } from "./-components/faq";
import { Feature } from "./-components/features";
import { Forecast } from "./-components/forecast";
import { Hero } from "./-components/hero";
import { LogoCloud } from "./-components/logo-cloud";
import Pricing from "./-components/pricing";
import { Stats } from "./-components/stats";

export const Route = createFileRoute("/_marketing/")({ component: App });

function App() {
  return (
    <div>
      <Hero />
      <Stats />
      <Feature />
      <Forecast />
      <LogoCloud />
      <Pricing />
      <FAQ />
      <CTA />
    </div>
  );
}
