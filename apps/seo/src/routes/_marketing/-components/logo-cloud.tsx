import { ChevronRight } from "@rectangular-labs/ui/components/icon";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { Link } from "@tanstack/react-router";

export function LogoCloud() {
  return (
    <Section className="bg-background" id="customers">
      <div className="group relative">
        <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
          <Link className="block text-sm duration-150 hover:opacity-75" to="/">
            <span>Trusted by teams shipping SEO at scale</span>

            <ChevronRight className="ml-1 inline-block size-3" />
          </Link>
        </div>
        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-12 gap-y-8 transition-all duration-500 group-hover:opacity-50 group-hover:blur-xs sm:gap-x-16 sm:gap-y-14">
          <div className="flex">
            <img
              alt="Nvidia Logo"
              className="mx-auto h-5 w-fit dark:invert"
              height="20"
              src="https://html.tailus.io/blocks/customers/nvidia.svg"
              width="auto"
            />
          </div>

          <div className="flex">
            <img
              alt="Column Logo"
              className="mx-auto h-4 w-fit dark:invert"
              height="16"
              src="https://html.tailus.io/blocks/customers/column.svg"
              width="auto"
            />
          </div>
          <div className="flex">
            <img
              alt="GitHub Logo"
              className="mx-auto h-4 w-fit dark:invert"
              height="16"
              src="https://html.tailus.io/blocks/customers/github.svg"
              width="auto"
            />
          </div>
          <div className="flex">
            <img
              alt="Nike Logo"
              className="mx-auto h-5 w-fit dark:invert"
              height="20"
              src="https://html.tailus.io/blocks/customers/nike.svg"
              width="auto"
            />
          </div>
          <div className="flex">
            <img
              alt="Lemon Squeezy Logo"
              className="mx-auto h-5 w-fit dark:invert"
              height="20"
              src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
              width="auto"
            />
          </div>
          <div className="flex">
            <img
              alt="Laravel Logo"
              className="mx-auto h-4 w-fit dark:invert"
              height="16"
              src="https://html.tailus.io/blocks/customers/laravel.svg"
              width="auto"
            />
          </div>
          <div className="flex">
            <img
              alt="Lilly Logo"
              className="mx-auto h-7 w-fit dark:invert"
              height="28"
              src="https://html.tailus.io/blocks/customers/lilly.svg"
              width="auto"
            />
          </div>

          <div className="flex">
            <img
              alt="OpenAI Logo"
              className="mx-auto h-6 w-fit dark:invert"
              height="24"
              src="https://html.tailus.io/blocks/customers/openai.svg"
              width="auto"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
