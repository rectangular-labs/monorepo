import { Section } from "@rectangular-labs/ui/components/ui/section";
import { Link } from "@tanstack/react-router";

export function Footer() {
  const links = [
    { title: "Founders", href: "/" },
    { title: "SEO Experts", href: "/seo-experts" },
    { title: "Referral", href: "/referral" },
    { title: "About us", href: "/who-we-are" },
  ];
  return (
    <div className="border-t">
      <Section as="footer" className="py-12">
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          {links.map((link) =>
            link.href.startsWith("#") ? (
              <Link
                className="text-muted-foreground transition-colors hover:text-foreground"
                key={link.title}
                to={link.href}
              >
                {link.title}
              </Link>
            ) : (
              <Link
                className="text-muted-foreground transition-colors hover:text-foreground"
                key={link.title}
                to={link.href}
              >
                {link.title}
              </Link>
            ),
          )}
        </div>
        <p className="mt-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Fluid Posts. All rights reserved.
        </p>
      </Section>
    </div>
  );
}
