import { createFileRoute } from "@tanstack/react-router";
import { CTA } from "~/components/cta";
import { Footer } from "~/components/footer";
import { Header } from "~/components/header";
import { Hero } from "~/components/hero";
import { Products } from "~/components/products";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      {/* <Brands /> */}
      <Products />
      <CTA />
      <Footer />
    </div>
  );
}
