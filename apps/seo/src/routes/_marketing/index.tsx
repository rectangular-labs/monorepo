import { createFileRoute } from "@tanstack/react-router";
import { CTA } from "./-components/cta";
import { FAQ } from "./-components/faq";
import { Feature } from "./-components/features";
import { Forecast } from "./-components/forecast";
import { Hero } from "./-components/hero";
import { LogoCloud } from "./-components/logo-cloud";
import Pricing from "./-components/pricing";
import { Stats } from "./-components/stats";

export const Route = createFileRoute("/_marketing/")({
  component: App,

  head: () => ({
    scripts: [
      {
        src:
          "https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=" +
          Math.random().toString(36).substring(7),
        async: true,
        defer: true,
        onload:
          "window.trackingFunctions.onLoad({appId:'68e8553db8cc65001148717d'})",
      },
    ],
  }),
});

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
