import { createFileRoute } from "@tanstack/react-router";
import { Brands } from "~/components/brands";
import { CTA } from "~/components/cta";
import { Footer } from "~/components/footer";
import { Hero } from "~/components/hero";
import { Products } from "~/components/products";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Brands />
      <Products />
      <CTA />
      <Footer />
    </div>
  );
}
