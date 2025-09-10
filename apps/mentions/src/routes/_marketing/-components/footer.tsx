import { Section } from "@rectangular-labs/ui/components/ui/section";

export function Footer() {
  const links = [
    { title: "How it works", href: "#how-it-works" },
    { title: "Pricing", href: "#pricing" },
    { title: "FAQ", href: "#faq" },
    { title: "Open Source", href: "https://github.com/rectangular-labs/" },
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
          © {new Date().getFullYear()} Rectangular Labs — Keyword mention
          tracking & AI reply assistant.
        </p>
      </Section>
    </div>
  );
}

export default Footer;
