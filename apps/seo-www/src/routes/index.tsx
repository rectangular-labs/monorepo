import { createFileRoute } from "@tanstack/react-router";
import { Benefits } from "~/routes/-components/benefits";
import { Credentials } from "~/routes/-components/credentials";
import { CTA } from "~/routes/-components/cta";
import { FAQ } from "~/routes/-components/faq";
import { Hero } from "~/routes/-components/hero";
import { Stats } from "~/routes/-components/stats";

export const Route = createFileRoute("/")({
  component: App,

  head: () => ({
    scripts: [
      {
        src:
          "https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=" +
          Math.random().toString(36).substring(7),
        async: true,
        defer: true,
        onLoad: () =>
          // biome-ignore lint/suspicious/noExplicitAny: apollo tracking
          (window as any).trackingFunctions.onLoad({
            appId: "68e8553db8cc65001148717d",
          }),
      },
    ],
  }),
});

function App() {
  return (
    <main className="bg-background">
      <Hero />
      <Benefits />
      <Credentials />
      <Stats />
      <CTA />
      <FAQ />
    </main>
  );
}
