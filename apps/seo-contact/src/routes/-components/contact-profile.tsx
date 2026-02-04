import {
  Check,
  Copy,
  ExternalLink,
  Logo,
} from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Card, CardContent } from "@rectangular-labs/ui/components/ui/card";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { useState } from "react";

type ContactProfileProps = {
  name: string;
  companyRole: string;
  email: string;
  phone: string;
  websiteUrl: string;
};

type CopyRowProps = {
  label: string;
  value: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

function CopyRow({
  label,
  value,
  actionLabel,
  actionHref,
  className,
}: CopyRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const CopyIcon = copied ? Check : Copy;

  return (
    <div
      className={cn(
        `flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between ${className}`,
      )}
    >
      <div>
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {label}
        </p>
        <p className="font-medium text-sm sm:text-base">{value}</p>
      </div>
      <div className="flex items-center gap-2 sm:min-w-[168px] sm:justify-end">
        {actionHref && actionLabel ? (
          <Button asChild className="min-w-18" size="sm" variant="outline">
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        ) : null}
        <Button
          aria-label={`Copy ${label}`}
          className="h-9 w-9"
          onClick={() => {
            void handleCopy();
          }}
          size="icon"
          type="button"
          variant="ghost"
        >
          <CopyIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ContactProfile({
  name,
  companyRole,
  email,
  phone,
  websiteUrl,
}: ContactProfileProps) {
  return (
    <main className="bg-background">
      <Section className="py-12 md:py-16">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <div className="flex w-full items-center justify-center gap-4">
                <Logo className="h-14 w-14" />
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                    Fluid Posts
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
                  {name}
                </h1>
                <p className="text-muted-foreground text-sm">{companyRole}</p>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-4">
              <CopyRow className="pt-0" label="Name" value={name} />
              <CopyRow
                actionHref={`mailto:${email}`}
                actionLabel="Email"
                label="Email"
                value={email}
              />
              <CopyRow
                actionHref={`sms:${phone.replace(/\s/g, "")}`}
                actionLabel="Text"
                label="Phone"
                value={phone}
              />
              <div className="flex flex-col gap-3 border-border/60 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Website
                  </p>
                  <p className="font-medium text-sm sm:text-base">
                    {websiteUrl}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:min-w-[168px] sm:justify-end">
                  <Button
                    asChild
                    className="min-w-29"
                    size="sm"
                    variant="outline"
                  >
                    <a href={websiteUrl} rel="noreferrer" target="_blank">
                      Visit
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>
    </main>
  );
}
