import { MoveRight } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rectangular-labs/ui/components/ui/dialog";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { useMemo, useState } from "react";
import { ONBOARD_LINK } from "./constants";

type Props = {
  trigger: React.ReactElement;
  className?: string;
};

export function WaitlistDialog({ trigger, className }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const trimmed = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }, [email]);

  async function submit() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Unable to submit");
      }
      // Both "registered" and "already_registered" are treated as success UX.
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Unable to submit");
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn("w-[calc(100%-2rem)] max-w-sm sm:max-w-sm", className)}
      >
        <DialogHeader>
          <DialogTitle>Join the waitlist</DialogTitle>
          <DialogDescription>
            Get launch updates and early access. No spam.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-2">
            <label className="font-medium text-sm" htmlFor="waitlist-email">
              Email
            </label>
            <Input
              autoComplete="email"
              id="waitlist-email"
              inputMode="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              type="email"
              value={email}
            />
          </div>

          {status === "success" ? (
            <p className="font-medium text-emerald-600 text-sm">
              Email registered.
            </p>
          ) : null}
          {status === "error" ? (
            <p className="font-medium text-destructive text-sm">{error}</p>
          ) : null}

          <div className="flex gap-2 pt-1">
            <Button
              className="h-10 flex-1 gap-2"
              disabled={
                !canSubmit || status === "loading" || status === "success"
              }
              isLoading={status === "loading"}
              onClick={submit}
              type="button"
            >
              Join waitlist <MoveRight className="h-4 w-4" />
            </Button>
            <Button asChild className="h-10" type="button" variant="outline">
              <a href={ONBOARD_LINK} rel="noopener" target="_blank">
                Book a call
              </a>
            </Button>
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed">
            Tip: set <code className="font-mono">WAITLIST_WEBHOOK_URL</code> in
            your env to forward signups to Apollo/Zapier/Make.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
