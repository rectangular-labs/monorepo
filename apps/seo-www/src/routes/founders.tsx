import { createFileRoute } from "@tanstack/react-router";
import { FounderCTA } from "~/routes/-components/founders/founder-cta";
import { FounderGrowth } from "~/routes/-components/founders/founder-growth";
import { FounderHero } from "~/routes/-components/founders/founder-hero";
import { FounderIntervention } from "~/routes/-components/founders/founder-intervention";
import { FounderLongGame } from "~/routes/-components/founders/founder-long-game";
import { FounderStrategist } from "~/routes/-components/founders/founder-strategist";
import { FounderTransparency } from "~/routes/-components/founders/founder-transparency";

export const Route = createFileRoute("/founders")({
  component: FoundersPage,
});

function FoundersPage() {
  return (
    <main className="bg-background">
      <FounderHero />
      <FounderTransparency />
      <FounderStrategist />
      <FounderGrowth />
      <FounderIntervention />
      <FounderLongGame />
      <FounderCTA />
    </main>
  );
}
