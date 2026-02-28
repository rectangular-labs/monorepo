import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/who-we-are")({
  component: WhoWeArePage,
});

function WhoWeArePage() {
  return (
    <main className="relative bg-white dark:bg-neutral-950">
      <section className="relative overflow-hidden bg-white py-16 sm:py-24 dark:bg-neutral-950">
        <div className="pointer-events-none absolute inset-0 opacity-[0.28] dark:opacity-[0.32]">
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full animate-grid-flow"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                height="32"
                id="hero-grid-pattern"
                patternUnits="userSpaceOnUse"
                width="32"
                x="0"
                y="0"
              >
                <path
                  className="text-emerald-600"
                  d="M0 32V0h32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect fill="url(#hero-grid-pattern)" height="100%" width="100%" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-neutral-950 dark:via-transparent dark:to-neutral-950" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="mb-4 font-medium text-emerald-600 text-xs uppercase tracking-[0.4em] dark:text-emerald-400">
              About Fluid Posts
            </p>
            <h1 className="mb-6 font-light font-serif text-[32px] text-neutral-900 leading-[1.1] tracking-[-0.02em] sm:text-[42px] md:text-[56px] dark:text-white">
              We help businesses grow
              <span className="text-emerald-600 dark:text-emerald-400">.</span>
              <br />
              <span className="text-emerald-600 dark:text-emerald-400">
                Organically.
              </span>
            </h1>
            <p className="mx-auto max-w-3xl text-base text-neutral-600 leading-relaxed sm:text-lg dark:text-neutral-300">
              Fluid Posts is an SEO company built by practitioners. We&apos;ve
              ranked our own sites, learned what works, and productised that
              system so other businesses can achieve the same results.
            </p>
            <div className="mx-auto mt-6 h-0.5 w-16 bg-emerald-600 dark:bg-emerald-400" />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-emerald-50 py-16 sm:py-24 dark:bg-neutral-900">
        <div className="pointer-events-none absolute inset-0 opacity-[0.22]">
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                height="50"
                id="team-dots"
                patternUnits="userSpaceOnUse"
                width="50"
                x="0"
                y="0"
              >
                <circle
                  className="text-emerald-600"
                  cx="25"
                  cy="25"
                  fill="currentColor"
                  r="1.5"
                />
              </pattern>
            </defs>
            <rect fill="url(#team-dots)" height="100%" width="100%" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-6 font-light font-serif text-[28px] text-neutral-900 leading-[1.1] tracking-[-0.02em] sm:text-[36px] md:text-[44px] dark:text-white">
            The Team
            <span className="text-emerald-600 dark:text-emerald-400">.</span>
          </h2>
          <p className="mb-8 text-neutral-600 leading-relaxed dark:text-neutral-300">
            Fluid Posts is run by two people. Winston spent five years in
            Silicon Valley building automation systems for startups; he handles
            the technical side—data pipelines, content systems, and
            infrastructure that runs reliably at scale. Aaron trained in law at
            Oxford and moved into content strategy; he leads keyword research,
            competitor analysis, and the editorial process that turns topics
            into pages that rank. We built the company after ranking our own
            projects and seeing the same approach work for clients.
          </p>
          <div className="flex flex-wrap gap-6 border-neutral-200 text-sm sm:border-l sm:pl-6 dark:border-neutral-700">
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">
                Winston
              </p>
              <p className="text-emerald-600 dark:text-emerald-400">
                Co-founder · Engineering
              </p>
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">
                Aaron
              </p>
              <p className="text-emerald-600 dark:text-emerald-400">
                Co-founder · Strategy
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-16 sm:py-24 dark:bg-neutral-950">
        <div className="pointer-events-none absolute inset-0 opacity-[0.28] dark:opacity-[0.32]">
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full animate-grid-flow"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                height="32"
                id="why-grid-pattern"
                patternUnits="userSpaceOnUse"
                width="32"
                x="0"
                y="0"
              >
                <path
                  className="text-emerald-600"
                  d="M0 32V0h32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect fill="url(#why-grid-pattern)" height="100%" width="100%" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-neutral-950 dark:via-transparent dark:to-neutral-950" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-6 font-light font-serif text-[28px] text-neutral-900 leading-[1.1] tracking-[-0.02em] sm:text-[36px] md:text-[44px] dark:text-white">
            How We Work
            <span className="text-emerald-600 dark:text-emerald-400">.</span>
          </h2>
          <div className="space-y-5 text-neutral-600 leading-relaxed dark:text-neutral-300">
            <p>
              We started by ranking our own sites. That meant testing what
              actually moved the needle—keyword research, content structure,
              technical SEO—and ignoring the rest. The process we use for
              clients is the same one we use for ourselves: understand the
              market, identify gaps, produce content that answers real queries,
              and keep optimising over time.
            </p>
            <p>
              Every engagement includes a strategy tailored to your market,
              content written to rank, and ongoing support so results hold. We
              don’t do long-term contracts or opaque retainers; we work in clear
              phases and report on what’s done.
            </p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-emerald-600 py-16 sm:py-24 dark:bg-emerald-800">
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="mb-4 font-light font-serif text-[28px] text-white leading-[1.1] tracking-[-0.02em] sm:text-[36px] md:text-[48px]">
            Get in Touch
            <span className="text-emerald-200 dark:text-emerald-300">.</span>
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-base text-emerald-100 sm:text-lg">
            Questions about how we work? Reach out—we&apos;re happy to talk
            through whether Fluid Posts is the right fit.
          </p>
          <div className="mx-auto mb-8 h-0.5 w-16 bg-emerald-200 dark:bg-emerald-300" />
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              className="w-full rounded-full bg-white px-8 py-4 font-medium text-emerald-700 transition-all hover:bg-emerald-50 sm:w-auto sm:px-12 dark:bg-emerald-50 dark:hover:bg-white"
              href="mailto:contact@fluidposts.com"
            >
              contact@fluidposts.com
            </a>
            <Link
              className="w-full rounded-full border-2 border-white px-8 py-4 font-medium text-white transition-all hover:bg-white hover:text-emerald-700 sm:w-auto sm:px-12"
              to="/legal/privacy-policy"
            >
              Privacy Policy
            </Link>
          </div>
          <p className="mt-8 text-emerald-200 text-sm">
            Fluid Posts Pte. Ltd. · UEN: 202546443Z · Singapore
          </p>
        </div>
      </section>
    </main>
  );
}
