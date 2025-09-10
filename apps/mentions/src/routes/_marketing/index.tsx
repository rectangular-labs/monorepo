import { createFileRoute } from "@tanstack/react-router";
import CTA from "./-components/cta";
import { FAQ1 } from "./-components/faq";
import Footer from "./-components/footer";
import { Header } from "./-components/header";
import { Hero3 } from "./-components/hero";
import SimplePricing from "./-components/pricing";
import { Stats2 } from "./-components/stats";

export const Route = createFileRoute("/_marketing/")({ component: App });

function App() {
  return (
    <>
      <div className="marketing-fun-bg">
        <Header />
        <main>
          <Hero3 />
          <Stats2 />
          <SimplePricing />
          <FAQ1 />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
}
