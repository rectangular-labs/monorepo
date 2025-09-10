import { cn } from "@rectangular-labs/ui/utils/cn";

export function Section({
  children,
  className,
  as,
}: {
  children: React.ReactNode;
  as?: React.ElementType<{ className: string }>;
  className?: string;
}) {
  const Comp = as ?? "section";
  return (
    <Comp className={cn("mx-auto max-w-5xl px-4 py-16 md:px-6", className)}>
      {children}
    </Comp>
  );
}
