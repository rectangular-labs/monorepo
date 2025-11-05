import { Loader } from "@rectangular-labs/ui/components/ai-elements/loader";
import { Section } from "@rectangular-labs/ui/components/ui/section";

export function Pending({ children }: { children?: React.ReactNode }) {
  return (
    <Section className="flex h-full w-full flex-1 items-center justify-center gap-3 text-center text-muted-foreground">
      <Loader size={20} />
      <span>{children || "Loading..."}</span>
    </Section>
  );
}
