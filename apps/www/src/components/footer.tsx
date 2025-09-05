import { Section } from "@rectangular-labs/ui/components/ui/section";

export function Footer() {
  const links = [
    { title: "Docs", href: "/docs" },
    { title: "Blog", href: "/blog" },
    { title: "Open Source", href: "https://github.com/rectangular-labs/" },
    { title: "About", href: "/docs" },
  ];
  return (
    <Section as="footer" className="border-t py-12">
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
        © {new Date().getFullYear()} Rectangular Labs. All rights reserved.
      </p>
    </Section>
  );
}

export default Footer;
