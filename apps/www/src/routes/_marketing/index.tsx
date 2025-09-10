import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Hero } from "~/components/hero";

// Lazy-load below-the-fold components to reduce initial JS and TBT
const Products = lazy(() => import("~/components/products"));
const CTA = lazy(() => import("~/components/cta"));

export const Route = createFileRoute("/_marketing/")({ component: App });

function App() {
  return (
    <>
      <Hero />
      {/* <Brands /> */}
      <Suspense fallback={null}>
        <Products />
      </Suspense>
      <Suspense fallback={null}>
        <CTA />
      </Suspense>
    </>
  );
}
