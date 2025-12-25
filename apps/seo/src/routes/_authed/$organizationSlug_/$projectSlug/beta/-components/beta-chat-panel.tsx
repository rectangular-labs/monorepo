"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBetaUi } from "~/routes/_authed/-components/beta-ui-provider";

export function BetaChatPanel() {
  const betaUi = useBetaUi();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const canSend = useMemo(() => draft.trim().length > 0, [draft]);

  useEffect(() => {
    // Use the dependency inside the effect to satisfy the hooks rule.
    const messageCount = betaUi.messages.length;
    if (messageCount < 1) return;

    // “Take over”: keep focus in the chat after actions add a message.
    inputRef.current?.focus();
    // And scroll to bottom.
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [betaUi.messages.length]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    betaUi.addMessage({ role: "user", content: text });
    betaUi.addMessage({
      role: "assistant",
      content:
        "Thanks — I’m mocked right now, but here’s what I would do next:\n\n- Confirm **target audience + intent**\n- Draft **outline + GEO angles**\n- Propose **internal links + schema**\n- Add to **schedule + review**\n\nWant me to optimize for **clicks**, **conversions**, or **GEO mentions**?",
    });
  };

  return (
    <aside className="flex h-full w-full flex-col bg-background">
      <div className="flex h-14 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <Icons.Sparkles className="size-4" />
          <span className="font-medium text-sm">Beta chat</span>
        </div>
        <Button
          aria-label="Close chat panel"
          onClick={() => betaUi.setChatOpen(false)}
          size="icon"
          variant="ghost"
        >
          <Icons.X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto" ref={listRef}>
        <div className="flex flex-col gap-3 p-3">
          {betaUi.messages.map((m) => (
            <div
              className={cn(
                "max-w-[92%] rounded-lg border px-3 py-2 text-sm leading-relaxed",
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted/40",
              )}
              key={m.id}
            >
              <div className="mb-1 text-[11px] opacity-70">
                {m.role === "user" ? "You" : "Assistant"}
              </div>
              <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask about clusters, audits, GEO strategy… (⌘/Ctrl+Enter to send)"
            ref={inputRef}
            rows={3}
            value={draft}
          />
          <Button disabled={!canSend} onClick={send}>
            Send
          </Button>
        </div>
      </div>
    </aside>
  );
}
