"use client";

import { useLocalStorage } from "@rectangular-labs/ui/hooks/use-local-storage";
import { useMatchRoute, useRouterState } from "@tanstack/react-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type BetaChatMessageRole = "user" | "assistant" | "system";
export type BetaChatMessage = {
  id: string;
  role: BetaChatMessageRole;
  content: string;
  createdAt: number;
};

export type BetaUiContextValue = {
  isBetaRoute: boolean;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  toggleChat: () => void;

  messages: BetaChatMessage[];
  addMessage: (message: Omit<BetaChatMessage, "id" | "createdAt">) => void;
  clearMessages: () => void;

  /**
   * Convenience for “clicking should add a chat message which should take over from there”.
   */
  runChatAction: (actionLabel: string) => void;
};

const BetaUiContext = createContext<BetaUiContextValue | null>(null);

export function useBetaUi(): BetaUiContextValue {
  const ctx = useContext(BetaUiContext);
  if (!ctx) {
    throw new Error("useBetaUi must be used within <BetaUiProvider />");
  }
  return ctx;
}

export function BetaUiProvider({ children }: { children: React.ReactNode }) {
  const matchRoute = useMatchRoute();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const projectParams = matchRoute({
    to: "/$organizationSlug/$projectSlug",
    fuzzy: true,
  });
  const isBetaRoute = !!projectParams && pathname.includes("/beta");

  const chatOpenKey = useMemo(() => {
    if (!projectParams || !isBetaRoute) return "seo-beta:chat-open";
    return `seo-beta:chat-open:${projectParams.organizationSlug}:${projectParams.projectSlug}`;
  }, [projectParams, isBetaRoute]);

  const [chatOpen, setChatOpen] = useLocalStorage<boolean>(chatOpenKey, true);
  const toggleChat = useCallback(() => {
    setChatOpen((v) => !v);
  }, [setChatOpen]);

  const [messages, setMessages] = useState<BetaChatMessage[]>(() => [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Welcome to **Beta**. Click a recommendation or cluster action and I’ll help you plan the work (content, GEO, audits, and rollout).",
      createdAt: Date.now(),
    },
  ]);

  // Reset ephemeral state when leaving beta routes.
  useEffect(() => {
    if (isBetaRoute) return;
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Welcome to **Beta**. Click a recommendation or cluster action and I’ll help you plan the work (content, GEO, audits, and rollout).",
        createdAt: Date.now(),
      },
    ]);
  }, [isBetaRoute]);

  const addMessage = useCallback(
    (message: Omit<BetaChatMessage, "id" | "createdAt">) => {
      // When actions/messages happen, keep chat “taking over” by opening it.
      if (!chatOpen) setChatOpen(true);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          ...message,
        },
      ]);
    },
    [chatOpen, setChatOpen],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const runChatAction = useCallback(
    (actionLabel: string) => {
      addMessage({ role: "user", content: actionLabel });
      addMessage({
        role: "assistant",
        content:
          "Got it. I can:\n\n- **Draft a cluster plan** (pillar → supporting pages, GEO angles, internal links)\n- **Propose updates** to fix decline (CTR, position, intent drift)\n- **Schedule writing + review** and outline what to ship next\n\nTell me your preference: **expand**, **update**, or **remove**?",
      });
    },
    [addMessage],
  );

  const value = useMemo<BetaUiContextValue>(
    () => ({
      isBetaRoute,
      chatOpen,
      setChatOpen,
      toggleChat,
      messages,
      addMessage,
      clearMessages,
      runChatAction,
    }),
    [
      isBetaRoute,
      chatOpen,
      setChatOpen,
      toggleChat,
      messages,
      addMessage,
      clearMessages,
      runChatAction,
    ],
  );

  return (
    <BetaUiContext.Provider value={value}>{children}</BetaUiContext.Provider>
  );
}
