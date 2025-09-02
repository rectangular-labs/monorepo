import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { baseOptions } from "../lib/layout";

type PostCardBaseProps = {
  href: string;
  title: string;
  description?: string | null;
  cover?: string | null;
  /** Optional element rendered below the description (e.g., tags, meta) */
  footer?: ReactNode;
};

type PostCardVariantProps =
  | { variant?: "card"; className?: ComponentPropsWithoutRef<"a">["className"] }
  | { variant: "list"; className?: ComponentPropsWithoutRef<"a">["className"] };

export type PostCardProps = PostCardBaseProps & PostCardVariantProps;

export function PostCard({
  href,
  title,
  description,
  cover,
  footer,
  variant = "card",
  className,
}: PostCardProps) {
  if (variant === "list") {
    return (
      <a className={className} href={href}>
        <Card className="group relative flex h-full overflow-hidden border-border/60 bg-card/80 shadow-sm ring-1 ring-border/40 transition-all duration-200 hover:border-border hover:shadow-md">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="Cover"
              className="hidden h-24 w-24 shrink-0 object-cover md:block"
              src={cover}
            />
          ) : null}
          <CardHeader className="flex-1 py-4">
            <div className="space-y-1">
              <CardTitle className="font-semibold text-base">{title}</CardTitle>
              {description ? (
                <CardDescription className="line-clamp-2">
                  {description}
                </CardDescription>
              ) : null}
            </div>
          </CardHeader>
        </Card>
      </a>
    );
  }

  return (
    <a className={className} href={href}>
      <Card className="group relative h-full overflow-hidden border-border/60 bg-card/80 shadow-sm ring-1 ring-border/40 transition-all duration-200 hover:border-border hover:shadow-md">
        {cover ? (
          <img alt="Cover" className="h-44 w-full object-cover" src={cover} />
        ) : null}
        <CardHeader className="flex items-start gap-3">
          <div className="space-y-1">
            <CardTitle className="font-semibold text-base">{title}</CardTitle>
            {description ? (
              <CardDescription className="line-clamp-2">
                {description}
              </CardDescription>
            ) : null}
          </div>
        </CardHeader>
        {footer ? <CardContent>{footer}</CardContent> : null}
      </Card>
    </a>
  );
}

export function PostsLayout({ children }: { children: ReactNode }) {
  return <HomeLayout {...baseOptions()}>{children}</HomeLayout>;
}
