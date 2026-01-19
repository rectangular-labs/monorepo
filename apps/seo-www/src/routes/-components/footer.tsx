import {
  LinkedInIcon,
  Logo,
  TikTokIcon,
} from "@rectangular-labs/ui/components/icon";
import { Link } from "@tanstack/react-router";

const links = [
  {
    group: "Solution",
    items: [
      {
        title: "Founders",
        href: "/",
      },
      {
        title: "Freelancers",
        href: "/seo-experts",
      },
    ],
  },
  {
    group: "Company",
    items: [
      {
        title: "About",
        href: "/who-we-are",
      },
      {
        title: "Referral",
        href: "/referral",
      },
      {
        title: "Blog",
        href: "/blog",
      },
    ],
  },
  {
    group: "Legal",
    items: [
      {
        title: "Privacy",
        href: "/legal/privacy-policy",
      },
      {
        title: "Data Processing Agreement",
        href: "/legal/data-processing-agreement",
      },
      {
        title: "Service Agreement",
        href: "/legal/service-agreement",
      },
    ],
  },
];

export function Footer() {
  return (
    <footer className="pt-14">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link aria-label="go home" className="block size-fit" to="/">
              <Logo className="size-12" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 md:col-span-3">
            {links.map((link) => (
              <div className="space-y-4 text-sm" key={link.group}>
                <span className="block font-medium">{link.group}</span>
                {link.items.map((item) => (
                  <Link
                    className="block text-muted-foreground hover:text-primary"
                    key={item.href}
                    to={item.href}
                  >
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6 py-6 pt-12">
          <span className="order-last block text-center text-muted-foreground text-sm md:order-first">
            © {new Date().getFullYear()} Fluid Posts, All rights reserved
          </span>
          <div className="order-first flex flex-wrap justify-center gap-6 text-sm md:order-last">
            <a
              aria-label="LinkedIn"
              className="block text-muted-foreground hover:text-primary"
              href="https://www.linkedin.com/company/fluid-posts/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <LinkedInIcon className="size-6" />
            </a>
            <a
              aria-label="TikTok"
              className="block text-muted-foreground hover:text-primary"
              href="https://www.tiktok.com/@fluidposts"
              rel="noopener noreferrer"
              target="_blank"
            >
              <TikTokIcon className="size-6" />
            </a>
            {/* <a
              aria-label="X/Twitter"
              className="block text-muted-foreground hover:text-primary"
              href="https://twitter.com/rectangularlabs"
              rel="noopener noreferrer"
              target="_blank"
            >
              <XIcon className="size-6" />
            </a> */}
            {/* <a
              aria-label="Facebook"
              className="block text-muted-foreground hover:text-primary"
              href="https://twitter.com/rectangularlabs"
              rel="noopener noreferrer"
              target="_blank"
            >
              <FacebookIcon className="size-6" />
            </a>
            <a
              aria-label="Threads"
              className="block text-muted-foreground hover:text-primary"
              href="https://twitter.com/rectangularlabs"
              rel="noopener noreferrer"
              target="_blank"
            >
              <ThreadsIcon className="size-6" />
            </a>
            <a
              aria-label="Instagram"
              className="block text-muted-foreground hover:text-primary"
              href="https://twitter.com/rectangularlabs"
              rel="noopener noreferrer"
              target="_blank"
            >
              <InstagramIcon className="size-6" />
            </a> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
