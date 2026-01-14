"use client";

import type {
  RouterOutputs,
  SeoChatMessage,
} from "@rectangular-labs/api-seo/types";
import { useQuery } from "@tanstack/react-query";
import { useMatchRoute } from "@tanstack/react-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getApiClientRq } from "~/lib/api";

type ProjectChatContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  input: string;
  setInput: (input: string) => void;
  organizationId: string | null;
  projectId: string | null;
  activeChatId: string | null;
  activeChat: RouterOutputs["chat"]["get"]["chat"] | null;
  isActiveChatLoading: boolean;
  startNewChat: () => void;
  selectChat: (chat: RouterOutputs["chat"]["list"]["data"][number]) => void;
  adoptChatId: (chatId: string) => void;
  chatList: RouterOutputs["chat"]["list"]["data"];
  isChatListLoading: boolean;
  refetchChatList: () => Promise<unknown>;
  chatMessages: SeoChatMessage[];
  isChatMessagesFetching: boolean;
};
const ProjectChatContext = createContext<ProjectChatContextValue | null>(null);

export function ProjectChatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const matcher = useMatchRoute();
  const projectParams = matcher({
    to: "/$organizationSlug/$projectSlug",
    fuzzy: true,
  });
  const { data: activeProject } = useQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        organizationIdentifier: projectParams
          ? projectParams.organizationSlug
          : "",
        identifier: projectParams ? projectParams.projectSlug : "",
      },
      enabled: !!projectParams,
    }),
  );
  const { organizationId, id: projectId } = activeProject ?? {
    organizationId: "",
    id: "",
  };

  const chatsQuery = useQuery(
    getApiClientRq().chat.list.queryOptions({
      input: {
        organizationId: organizationId ?? "",
        projectId: projectId ?? "",
        limit: 20,
      },
      enabled: !!organizationId && !!projectId,
    }),
  );

  const chatQuery = useQuery(
    getApiClientRq().chat.get.queryOptions({
      input: {
        organizationId: organizationId ?? "",
        projectId: projectId ?? "",
        id: activeChatId ?? "",
      },
      enabled: !!organizationId && !!projectId && !!activeChatId,
    }),
  );

  const messagesQuery = useQuery(
    getApiClientRq().chat.messages.queryOptions({
      input: {
        organizationId: organizationId ?? "",
        projectId: projectId ?? "",
        id: activeChatId ?? "",
        limit: 10,
      },
      enabled: !!organizationId && !!projectId && !!activeChatId,
    }),
  );

  const startNewChat = useCallback(() => {
    setActiveChatId(null);
    setHistoryOpen(false);
  }, []);

  const selectChat = useCallback(
    (chat: RouterOutputs["chat"]["list"]["data"][number]) => {
      if (!organizationId || !projectId) return;
      setActiveChatId(chat.id);
      setHistoryOpen(false);
      // arbitrary timeout to allow the chat to load before focusing the textarea
      setTimeout(() => {
        const textarea = document.querySelector<HTMLTextAreaElement>(
          'textarea[name="message"]',
        );
        textarea?.focus();
      }, 800);
    },
    [organizationId, projectId],
  );

  const adoptChatId = useCallback(
    (chatId: string) => {
      setActiveChatId(chatId);
      void chatQuery.refetch();
      void chatsQuery.refetch();
    },
    [chatsQuery.refetch, chatQuery.refetch],
  );

  const openChat = useCallback(() => {
    setIsOpen(true);
    if (activeChatId) {
      return;
    }
    setHistoryOpen(true);
    void chatQuery.refetch();
    void chatsQuery.refetch();
  }, [activeChatId, chatsQuery.refetch, chatQuery.refetch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod) return;
      if (event.altKey || event.shiftKey) return;
      console.log("event.key", event.key);
      // Start a new chat (only when the chat input is focused).
      if (event.key === ".") {
        const activeEl = document.activeElement;
        if (
          activeEl instanceof HTMLTextAreaElement &&
          activeEl.name === "message"
        ) {
          event.preventDefault();
          startNewChat();
          requestAnimationFrame(() => {
            const textarea = document.querySelector<HTMLTextAreaElement>(
              'textarea[name="message"]',
            );
            textarea?.focus();
          });
        }
        return;
      }
      if (event.key.toLowerCase() !== "e") return;

      event.preventDefault();

      // Toggle the assistant panel.
      if (isOpen) {
        setIsOpen(false);
        return;
      }

      openChat();

      // Try to focus the chat textarea once it mounts (best-effort).
      requestAnimationFrame(() => {
        const textarea = document.querySelector<HTMLTextAreaElement>(
          'textarea[name="message"]',
        );
        textarea?.focus();
      });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, startNewChat, openChat]);

  const value = useMemo<ProjectChatContextValue>(() => {
    console.log("messagesQuery", messagesQuery.data?.data);

    return {
      isOpen,
      open: openChat,
      close: () => setIsOpen(false),
      toggle: () => {
        isOpen ? setIsOpen(false) : openChat();
      },
      historyOpen,
      setHistoryOpen,
      input,
      setInput,
      organizationId,
      projectId,
      activeChatId,
      startNewChat,
      selectChat,
      adoptChatId,
      chatList: chatsQuery.data?.data ?? [],
      isChatListLoading: chatsQuery.isLoading,
      refetchChatList: chatsQuery.refetch,
      activeChat: activeChatId ? (chatQuery.data?.chat ?? null) : null,
      isActiveChatLoading: activeChatId ? chatQuery.isLoading : false,
      chatMessages: activeChatId
        ? (messagesQuery.data?.data.toReversed() ?? [])
        : [],
      isChatMessagesFetching: activeChatId ? messagesQuery.isFetching : false,
    };
  }, [
    input,
    historyOpen,
    activeChatId,
    adoptChatId,
    chatsQuery.isLoading,
    chatsQuery.refetch,
    chatsQuery.data?.data,
    chatQuery.data?.chat,
    chatQuery.isLoading,
    isOpen,
    messagesQuery.isFetching,
    messagesQuery.data?.data,
    organizationId,
    projectId,
    selectChat,
    startNewChat,
    openChat,
  ]);

  return (
    <ProjectChatContext.Provider value={value}>
      {children}
    </ProjectChatContext.Provider>
  );
}

export function useProjectChat() {
  const ctx = useContext(ProjectChatContext);
  if (!ctx) {
    throw new Error("useProjectChat must be used within ProjectChatProvider");
  }
  return ctx;
}
