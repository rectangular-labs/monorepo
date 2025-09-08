import { createFileRoute } from "@tanstack/react-router";
import { CTA } from "~/components/cta";
import { Hero } from "~/components/hero";
import { Products } from "~/components/products";
import { clientEnv } from "~/lib/env";

export const Route = createFileRoute("/_marketing/")({ component: App });

function App() {
  return (
    <>
      <div>{clientEnv().VITE_APP_URL}</div>
      <Hero />
      {/* <Brands /> */}
      <Products />
      <CTA />
    </>
  );
}
