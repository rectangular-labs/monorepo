import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

// ============================================
// SHARED BACKGROUND - Gradient Mesh (recommended)
// ============================================

function GradientBackground({ variant = "hero" }: { variant?: "hero" | "light" | "subtle" }) {
  const intensity = variant === "hero" ? 1 : variant === "light" ? 0.6 : 0.3;
  
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-[300px] left-[5%] h-[600px] w-[600px] rounded-full blur-[100px]"
        style={{ background: `rgba(59, 130, 246, ${0.25 * intensity})` }}
        animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[10%] -right-[100px] h-[500px] w-[500px] rounded-full blur-[100px]"
        style={{ background: `rgba(139, 92, 246, ${0.2 * intensity})` }}
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-[200px] left-[25%] h-[400px] w-[500px] rounded-full blur-[100px]"
        style={{ background: `rgba(6, 182, 212, ${0.15 * intensity})` }}
        animate={{ x: [0, -30, 0], y: [0, -15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// ============================================
// HERO SECTION
// ============================================

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden py-20">
      <GradientBackground variant="hero" />
      
      <div className="relative mx-auto max-w-6xl px-6 pt-16">
        <h1 className="mb-6 text-center">
          <span className="block font-light font-serif text-[44px] text-neutral-900 leading-[1.08] tracking-[-0.02em] sm:text-[60px] md:text-[76px]">
            Take Your Brand to the
          </span>
          <span className="mt-1 block font-light font-serif text-[44px] text-neutral-900 italic leading-[1.08] tracking-[-0.02em] sm:text-[60px] md:text-[76px]">
            Top of Search<span className="text-blue-600">.</span>
          </span>
        </h1>
        
        <p className="mx-auto mb-10 max-w-2xl text-center text-lg text-neutral-500 leading-relaxed">
          We create strategic content and build authoritative backlinks that push your brand 
          to #1 on Google, AI Overviews, and ChatGPT.
        </p>
        
        <div className="flex justify-center gap-4">
          <button type="button" className="rounded-full bg-blue-600 px-8 py-3.5 font-medium text-white shadow-blue-600/25 shadow-lg transition-all hover:bg-blue-700 hover:shadow-blue-600/30 hover:shadow-xl">
            Get Started
          </button>
          <button type="button" className="rounded-full border border-neutral-300 bg-white px-8 py-3.5 font-medium text-neutral-700 transition-all hover:border-neutral-400 hover:bg-neutral-50">
            See How It Works
          </button>
        </div>

        {/* Placeholder for carousel graphic */}
        <div className="mx-auto mt-16 max-w-[640px]">
          <div className="aspect-[4/3] rounded-3xl border border-neutral-200 bg-white/80 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] backdrop-blur-sm">
            <div className="flex h-full items-center justify-center text-neutral-400">
              [Hero Carousel Graphic]
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// SOCIAL PROOF - Single Quote
// ============================================

function SocialProofSection() {
  return (
    <section className="relative overflow-hidden border-neutral-100 border-y bg-neutral-50/50 py-16">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <blockquote className="font-serif text-neutral-700 text-xl italic leading-relaxed sm:text-2xl">
          &quot;We went from page 5 to ranking #1 for our main keyword in under 90 days. 
          The ROI paid for itself in the first month.&quot;
        </blockquote>
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500" />
          <div className="text-left">
            <div className="font-medium text-neutral-900">Sarah Chen</div>
            <div className="text-neutral-500 text-sm">Head of Growth, TechStartup</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// HOW IT WORKS
// ============================================

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Strategic Content",
      desc: "We research your market and create high-quality content optimized for both search engines and AI systems.",
    },
    {
      num: "02", 
      title: "Authority Links",
      desc: "We build backlinks from trusted, relevant sources that signal authority to Google and AI platforms.",
    },
    {
      num: "03",
      title: "Rank & Dominate",
      desc: "Watch your brand climb to #1 and stay there. We monitor, adjust, and keep you on top.",
    },
  ];

  return (
    <section className="relative overflow-hidden py-24">
      <GradientBackground variant="subtle" />
      
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-light font-serif text-[36px] text-neutral-900 leading-tight sm:text-[48px]">
            How We Get You to #1<span className="text-blue-600">.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-neutral-500">
            A proven system that combines content excellence with strategic link building.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.num} className="rounded-2xl border border-neutral-200 bg-white/80 p-8 backdrop-blur-sm transition-shadow hover:shadow-lg">
              <span className="mb-4 block font-light font-mono text-5xl text-blue-600">{step.num}</span>
              <h3 className="mb-3 font-medium text-neutral-900 text-xl">{step.title}</h3>
              <p className="text-neutral-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// RESULTS - Mini Case Study
// ============================================

function ResultsSection() {
  return (
    <section className="relative overflow-hidden bg-neutral-900 py-24 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[200px] left-[10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute right-[10%] -bottom-[200px] h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-light font-serif text-[36px] leading-tight sm:text-[48px]">
            Real Results<span className="text-blue-400">.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-neutral-400">
            Don&apos;t take our word for it. Here&apos;s what happens when we work together.
          </p>
        </div>

        {/* Mini Case Study */}
        <div className="mx-auto max-w-4xl rounded-3xl border border-neutral-800 bg-neutral-800/50 p-8 backdrop-blur-sm sm:p-12">
          <div className="mb-8 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
            <div className="text-center">
              <div className="mb-1 font-medium text-neutral-500 text-xs uppercase tracking-wider">Before</div>
              <div className="font-serif text-5xl text-neutral-500 sm:text-6xl">Page 5</div>
              <div className="mt-1 text-neutral-600 text-sm">Invisible to customers</div>
            </div>
            
            <div className="flex items-center">
              <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            
            <div className="text-center">
              <div className="mb-1 font-medium text-blue-400 text-xs uppercase tracking-wider">After 90 Days</div>
              <div className="font-serif text-5xl text-white sm:text-6xl">#1</div>
              <div className="mt-1 text-neutral-400 text-sm">Dominating search</div>
            </div>
          </div>

          <div className="grid gap-6 border-neutral-700 border-t pt-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="font-serif text-3xl text-white">312%</div>
              <div className="mt-1 text-neutral-400 text-sm">Traffic increase</div>
            </div>
            <div className="text-center">
              <div className="font-serif text-3xl text-white">47</div>
              <div className="mt-1 text-neutral-400 text-sm">Keywords on page 1</div>
            </div>
            <div className="text-center">
              <div className="font-serif text-3xl text-white">8.2x</div>
              <div className="mt-1 text-neutral-400 text-sm">ROI in 6 months</div>
            </div>
          </div>

          <div className="mt-8 border-neutral-700 border-t pt-8 text-center">
            <p className="text-neutral-400 italic">&quot;FluidPosts transformed our entire organic strategy.&quot;</p>
            <p className="mt-2 text-neutral-500 text-sm">— Marketing Director, B2B SaaS Company</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FEATURES / WHAT YOU GET
// ============================================

function FeaturesSection() {
  const features = [
    {
      title: "AI-Optimized Content",
      desc: "Content engineered to rank on Google AND get cited by ChatGPT, Claude, and AI Overviews.",
      icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    },
    {
      title: "Authority Backlinks", 
      desc: "High-quality links from real, relevant websites. No spam, no shortcuts, just real authority.",
      icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
    },
    {
      title: "Rank Tracking",
      desc: "Real-time monitoring across Google, Bing, and AI platforms. Know exactly where you stand.",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
    {
      title: "Competitor Analysis",
      desc: "We reverse-engineer what&apos;s working for your competitors so you can outrank them.",
      icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    },
  ];

  return (
    <section className="relative overflow-hidden py-24">
      <GradientBackground variant="light" />
      
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-light font-serif text-[36px] text-neutral-900 leading-tight sm:text-[48px]">
            Everything You Need<span className="text-blue-600">.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-neutral-500">
            A complete system for dominating search—traditional and AI-powered.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-5 rounded-2xl border border-neutral-200 bg-white/80 p-6 backdrop-blur-sm transition-shadow hover:shadow-lg">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label={feature.title}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-lg text-neutral-900">{feature.title}</h3>
                <p className="text-neutral-500 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// CTA SECTION
// ============================================

function CTASection() {
  return (
    <section className="relative overflow-hidden py-24">
      <GradientBackground variant="hero" />
      
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <h2 className="mb-6 font-light font-serif text-[36px] text-neutral-900 leading-tight sm:text-[52px]">
          Ready to Rank #1<span className="text-blue-600">?</span>
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-neutral-500 leading-relaxed">
          Join 50+ brands that have transformed their search presence. 
          Let&apos;s discuss how we can get you to the top.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button type="button" className="w-full rounded-full bg-blue-600 px-10 py-4 font-medium text-white shadow-blue-600/25 shadow-lg transition-all hover:bg-blue-700 hover:shadow-blue-600/30 hover:shadow-xl sm:w-auto">
            Get Your Free Strategy Call
          </button>
          <button type="button" className="w-full rounded-full border border-neutral-300 bg-white px-10 py-4 font-medium text-neutral-700 transition-all hover:border-neutral-400 hover:bg-neutral-50 sm:w-auto">
            See Pricing
          </button>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FAQ SECTION
// ============================================

function FAQSection() {
  const faqs = [
    {
      q: "How long until I see results?",
      a: "Most clients see meaningful ranking improvements within 60-90 days. SEO is a long-term play, but our approach accelerates results significantly.",
    },
    {
      q: "Do you guarantee #1 rankings?",
      a: "No one can guarantee specific rankings—anyone who does is lying. What we guarantee is a proven process, transparent reporting, and relentless optimization.",
    },
    {
      q: "How is this different from other SEO agencies?",
      a: "We focus specifically on the new landscape: Google + AI platforms. Most agencies are still stuck in 2015. We're building for where search is going.",
    },
    {
      q: "What kind of backlinks do you build?",
      a: "Real editorial links from relevant, authoritative sites. No PBNs, no spam, no shortcuts. Quality over quantity, always.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="border-neutral-200 border-t bg-neutral-50/50 py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-12 text-center font-light font-serif text-[36px] text-neutral-900 leading-tight sm:text-[48px]">
          Questions<span className="text-blue-600">?</span>
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="rounded-xl border border-neutral-200 bg-white">
              <button
                type="button"
                className="flex w-full items-center justify-between px-6 py-5 text-left"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-medium text-neutral-900">{faq.q}</span>
                <svg
                  className={`h-5 w-5 text-neutral-400 transition-transform ${openIndex === i ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-neutral-100 border-t px-6 py-5 text-neutral-500 leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// FOOTER
// ============================================

function Footer() {
  return (
    <footer className="border-neutral-200 border-t bg-white py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="font-light font-serif text-neutral-900 text-xl">FluidPosts</div>
          <div className="flex gap-8 text-neutral-500 text-sm">
            <button type="button" className="hover:text-neutral-900">Privacy</button>
            <button type="button" className="hover:text-neutral-900">Terms</button>
            <button type="button" className="hover:text-neutral-900">Contact</button>
          </div>
          <div className="text-neutral-400 text-sm">© 2024 FluidPosts</div>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// FULL PAGE
// ============================================

export function LandingPageMockup() {
  return (
    <div className="bg-white">
      <HeroSection />
      <SocialProofSection />
      <HowItWorksSection />
      <ResultsSection />
      <FeaturesSection />
      <CTASection />
      <FAQSection />
      <Footer />
    </div>
  );
}
