import { createFileRoute } from "@tanstack/react-router";
import { CTA } from "~/components/cta";
import { Hero } from "~/components/hero";
import { Products } from "~/components/products";

export const Route = createFileRoute("/_marketing/")({ component: App });

function App() {
  return (
    <>
      <Hero />
      {/* <Brands /> */}
      <Products />
      <CTA />
    </>
  );
}
