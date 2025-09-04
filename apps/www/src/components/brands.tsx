export function Brands() {
  return (
    <section className="section">
      <div className="container-narrow">
        <h2 className="text-center font-medium text-lg">
          Trusted building blocks
        </h2>
        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-80">
          <img
            alt="GitHub"
            className="h-5 w-auto dark:invert"
            src="/logos/github.svg"
          />
          <img
            alt="Vercel"
            className="h-5 w-auto dark:invert"
            src="/logos/vercel.svg"
          />
          <img
            alt="OpenAI"
            className="h-5 w-auto dark:invert"
            src="/logos/openai.svg"
          />
          <img
            alt="Tailwind"
            className="h-5 w-auto dark:invert"
            src="/logos/tailwindcss.svg"
          />
          <img
            alt="pnpm"
            className="h-5 w-auto dark:invert"
            src="/logos/pnpm.svg"
          />
        </div>
      </div>
    </section>
  );
}

export default Brands;
