import { createFileRoute } from "@tanstack/react-router";
import { Benefits } from "./-components/benefits";
import { Credentials } from "./-components/credentials";
import { CTA } from "./-components/cta";
import { FAQ } from "./-components/faq";
import { Hero } from "./-components/hero";
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
    <div className="bg-background">
      <Hero />
      <Benefits />
      <Credentials />
      <Stats />
      <CTA />
      <FAQ />
    </div>
  );
}
