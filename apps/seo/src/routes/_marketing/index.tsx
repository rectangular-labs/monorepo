import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "./-components/hero";
import { Features } from "./-components/features";
import { Control } from "./-components/control";
import { Data } from "./-components/data";
import { Proof } from "./-components/proof";

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
    <div className="bg-background">
      <Hero />
      <Features />
      <Control />
      <Data />
      <Proof />
    </div>
  );
}
