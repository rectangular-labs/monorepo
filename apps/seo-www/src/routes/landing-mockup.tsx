import { createFileRoute } from "@tanstack/react-router";
import { LandingPageMockup } from "~/routes/-components/founders/landing-page-mockup";

export const Route = createFileRoute("/landing-mockup")({
  component: LandingMockupPage,
});

function LandingMockupPage() {
  return (
    <main className="bg-white">
      <LandingPageMockup />
    </main>
  );
}
