import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "./-components/hero";
import { Expertise } from "./-components/expertise";
import { Reporting } from "./-components/reporting";
import { Strategy } from "./-components/strategy";
import { Writer } from "./-components/writer";
import { CTA } from "./-components/cta";
import { Footer } from "./-components/footer";
import { Header } from "./-components/header";

// Landing page for freelancers - Section 1 to 5
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
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <Expertise />
        <Reporting />
        <Strategy />
        <Writer />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
