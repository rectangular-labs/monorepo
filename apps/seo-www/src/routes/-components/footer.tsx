import { Section } from "@rectangular-labs/ui/components/ui/section";

export function Footer() {
  const links = [
    { title: "Benefits", href: "#benefits" },
    { title: "Who we are", href: "#credentials" },
    { title: "FAQ", href: "#faq" },
  ];
  return (
    <div className="border-t">
      <Section as="footer" className="py-12">
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          {links.map((link) => (
            <a
              className="text-muted-foreground transition-colors hover:text-foreground"
              href={link.href}
              key={link.title}
            >
              {link.title}
            </a>
          ))}
        </div>
        <p className="mt-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Fluid Posts. All rights reserved.
        </p>
      </Section>
    </div>
  );
}
