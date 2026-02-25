import { createFileRoute } from "@tanstack/react-router";
import { LandingSectionsDemo } from "~/routes/-components/founders/landing-sections-demo";

export const Route = createFileRoute("/landing-demo")({
  component: LandingDemoPage,
});

function LandingDemoPage() {
  return (
    <main className="bg-white">
      <LandingSectionsDemo />
    </main>
  );
}
