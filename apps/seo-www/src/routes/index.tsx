import { createFileRoute } from "@tanstack/react-router";
import { FounderCTA } from "~/routes/-components/founders/founder-cta";
import { FounderGrowth } from "~/routes/-components/founders/founder-growth";
import { FounderHero } from "~/routes/-components/founders/founder-hero";
import { FounderIntervention } from "~/routes/-components/founders/founder-intervention";
import { FounderStrategist } from "~/routes/-components/founders/founder-strategist";
import { FounderTransparency } from "~/routes/-components/founders/founder-transparency";
import { FounderWhatItIs } from "~/routes/-components/founders/founder-what-it-is";

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
      <FounderHero />
      <FounderWhatItIs />
      <FounderTransparency />
      <FounderStrategist />
      <FounderGrowth />
      <FounderIntervention />
      <FounderCTA />
    </main>
  );
}
