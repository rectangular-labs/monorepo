import { createFileRoute } from "@tanstack/react-router";
import { FounderHero } from "./-components/founder-hero";
import { FounderTransparency } from "./-components/founder-transparency";
import { FounderStrategist } from "./-components/founder-strategist";
import { FounderGrowth } from "./-components/founder-growth";
import { FounderIntervention } from "./-components/founder-intervention";
import { FounderLongGame } from "./-components/founder-long-game";
import { FounderCTA } from "./-components/founder-cta";

// Landing page for founders
export const Route = createFileRoute("/_marketing/")({
  component: App,
});

function App() {
  return (
    <>
      <FounderHero />
      <FounderTransparency />
      <FounderStrategist />
      <FounderGrowth />
      <FounderIntervention />
      <FounderLongGame />
      <FounderCTA />
    </>
  );
}
