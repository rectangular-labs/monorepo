import { MarkdownContent } from "@rectangular-labs/ui/components/chat/markdown-content";
import { Section } from "@rectangular-labs/ui/components/ui/section";

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  content: string;
  contentId: string;
}

export function LegalPageLayout({
  title,
  subtitle,
  content,
  contentId,
}: LegalPageLayoutProps) {
  return (
    <main className="bg-background">
      <Section className="border-border border-b bg-muted/20">
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-16">
          <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.4em]">
            Legal
          </p>
          <h1 className="font-regular text-4xl text-foreground tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-4xl px-4 py-16">
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <MarkdownContent content={content} id={contentId} />
          </article>
        </div>
      </Section>
    </main>
  );
}
