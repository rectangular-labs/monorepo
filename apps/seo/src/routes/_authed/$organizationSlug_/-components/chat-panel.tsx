"use client";
import { useChat } from "@ai-sdk/react";
import { websocketClient } from "@rectangular-labs/api-seo/client";
import type {
  SeoChatMessage,
  WebSocketMessages,
} from "@rectangular-labs/api-seo/types";
import { NO_SEARCH_CONSOLE_ERROR_MESSAGE } from "@rectangular-labs/db/parsers";
import { safeSync } from "@rectangular-labs/result";
import {
  Action,
  Actions,
} from "@rectangular-labs/ui/components/ai-elements/actions";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@rectangular-labs/ui/components/ai-elements/conversation";
import { Loader } from "@rectangular-labs/ui/components/ai-elements/loader";
import {
  Message,
  MessageContent,
} from "@rectangular-labs/ui/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@rectangular-labs/ui/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@rectangular-labs/ui/components/ai-elements/reasoning";
import { Response } from "@rectangular-labs/ui/components/ai-elements/response";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@rectangular-labs/ui/components/ai-elements/sources";
import { TaskItemFile } from "@rectangular-labs/ui/components/ai-elements/task";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@rectangular-labs/ui/components/ai-elements/tool";
import { Copy, File, RefreshCcw } from "@rectangular-labs/ui/components/icon";
import { useInfiniteQuery } from "@tanstack/react-query";
import { readUIMessageStream, type UIMessageChunk } from "ai";
import { useWebSocket } from "partysocket/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { GscConnectionCard } from "./gsc-connection-card";

const models = [
  { name: "Claude", value: "anthropic/claude-haiku-4-5" },
  { name: "Open AI", value: "openai/gpt-5-mini" },
];

export function ChatPanel({
  campaignId,
  projectId,
  organizationId,
}: {
  campaignId: string;
  projectId: string;
  organizationId: string;
}) {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(models[0]?.value ?? "");

  const {
    data: messagePages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    getApiClientRq().campaigns.messages.infiniteOptions({
      input: (pageParam) => ({
        id: campaignId,
        organizationId,
        projectId,
        limit: 10,
        cursor: pageParam,
      }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextPageCursor,
    }),
  );
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [pendingStreams] = useState<
    Map<string, { controller: ReadableStreamDefaultController<UIMessageChunk> }>
  >(new Map());

  const webSocketUrl = `${typeof window !== "undefined" ? window.location.origin.replace("https", "wss") : "https://localhost:3000"}/api/realtime/organization/${organizationId}/project/${projectId}/campaign/${campaignId}/room`;
  // Use a ref to store the websocket client so closures always access the latest instance
  const webSocketClientRef = useRef<ReturnType<typeof useWebSocket> | null>(
    null,
  );
  const webSocketClient = useWebSocket(webSocketUrl, undefined, {
    onMessage: async (event) => {
      const dataResult = safeSync(() => JSON.parse(event.data));
      if (!dataResult.ok) {
        console.error("Error parsing WebSocket message:", dataResult.error);
        return;
      }
      const data = dataResult.value;
      if (
        typeof data !== "object" ||
        data === null ||
        !("type" in data) ||
        typeof data.type !== "string"
      ) {
        // irrelevant message
        return;
      }
      const castData = data as WebSocketMessages;
      switch (castData.type) {
        case "msg-chunk": {
          const { chunk, clientMessageId } = castData;
          let controller = pendingStreams.get(clientMessageId)?.controller;
          if (!controller) {
            console.log("no existing controller, creating new one");
            const newController = await navigator.locks.request(
              clientMessageId,
              { mode: "exclusive" },
              async () => {
                const controller =
                  pendingStreams.get(clientMessageId)?.controller;
                if (controller) {
                  return controller;
                }
                // external message, we create a custom stream for processing it
                const stream = new ReadableStream<UIMessageChunk>({
                  cancel: () => {
                    console.log("cancel", clientMessageId);
                    pendingStreams.delete(clientMessageId);
                  },
                  start: (controller) => {
                    console.log("start", clientMessageId);
                    pendingStreams.get(clientMessageId)?.controller.close();
                    pendingStreams.set(clientMessageId, { controller });
                  },
                });
                for await (const uiMessage of readUIMessageStream<SeoChatMessage>(
                  { stream },
                )) {
                  const messageId = (() => {
                    if (chunk.type === "start") {
                      return chunk.messageId;
                    }
                    return;
                  })();
                  const metadata = (() => {
                    if (chunk.type === "start") {
                      return chunk.messageMetadata;
                    }
                    return;
                  })();
                  uiMessage.id = messageId ?? "";
                  uiMessage.metadata = metadata;
                  setMessages((prev) => {
                    let isExisting = false;
                    const newMessages = prev.map((message) => {
                      if (message.id === uiMessage.id) {
                        isExisting = true;
                        return uiMessage;
                      }
                      return message;
                    });
                    if (isExisting) {
                      return newMessages;
                    }
                    return [...newMessages, uiMessage];
                  });
                }
                return pendingStreams.get(clientMessageId)?.controller;
              },
            );
            controller = newController;
          }
          if (!controller) {
            return;
          }
          controller.enqueue(chunk);
          // Handle completion events
          if (chunk.type === "finish" || chunk.type === "error") {
            controller.close();
            pendingStreams.delete(clientMessageId);
          }
          break;
        }
        case "new-msg": {
          const { message } = castData;
          setMessages((prev) => [...prev, message]);
          break;
        }
        default:
          console.warn("Invalid WebSocket message type:", data.type);
          return;
      }
    },
    onError: (event) => {
      console.error("error", event);
    },
    onClose: (event) => {
      console.error("close", event);
    },
    onOpen: (event) => {
      console.log("open", event);
    },
  });
  webSocketClientRef.current = webSocketClient;

  const { messages, setMessages, sendMessage, status, regenerate, stop } =
    useChat<SeoChatMessage>({
      transport: {
        reconnectToStream: async () => null,
        sendMessages: ({
          abortSignal,
          chatId,
          messageId,
          messages,
          trigger,
          ...options
        }) => {
          const clientMessageId = crypto.randomUUID();

          // Create the stream
          const stream = new ReadableStream<UIMessageChunk>({
            cancel: () => {
              console.log("cancel", clientMessageId);
              pendingStreams.delete(clientMessageId);
            },
            start: (controller) => {
              pendingStreams.set(clientMessageId, { controller });
            },
          });
          if (abortSignal) {
            abortSignal.addEventListener("abort", () => {
              console.log("abort", clientMessageId);
              pendingStreams
                .get(clientMessageId)
                ?.controller.error(new Error("Aborted"));
              pendingStreams.get(clientMessageId)?.controller.close();
              pendingStreams.delete(clientMessageId);
            });
          }

          // Use the ref to get the latest websocket client (avoids stale closure issues)
          const currentWs = webSocketClientRef.current;
          if (!currentWs || currentWs.readyState !== WebSocket.OPEN) {
            console.error(
              "WebSocket not ready:",
              currentWs?.readyState,
              "expected:",
              WebSocket.OPEN,
            );
            throw new Error("WebSocket connection is not open");
          }

          // Send the message to the agent
          // The websocket client from ORPC listens to messages coming back from the server, but we don't want to listen to them here since we handle it on our own.
          // Thus we proxy the websocket client to prevent it from listening to messages coming back from the server.
          const proxyWs = new Proxy(currentWs, {
            get(target, prop, receiver) {
              if (prop === "addEventListener") {
                return (
                  type: string,
                  listener: EventListenerOrEventListenerObject,
                  options?: boolean | AddEventListenerOptions,
                ) => {
                  if (type === "message") {
                    return;
                  }
                  return target.addEventListener(type, listener, options);
                };
              }
              return Reflect.get(target, prop, receiver);
            },
          });
          const wsClient = websocketClient(proxyWs as unknown as WebSocket);
          wsClient.campaign.room({
            messages: messages as SeoChatMessage[],
            clientMessageId,
            ...options,
          });

          return Promise.resolve(stream);
        },
      },
      onError: (error) => {
        console.error("error", error);
      },
      id: campaignId,
    });
  useEffect(() => {
    const historyMessages = (messagePages?.pages ?? [])
      .flatMap((page) => page.data)
      .reverse();
    setMessages(historyMessages);
  }, [messagePages, setMessages]);

  useEffect(() => {
    if (!hasNextPage || !loadMoreRef.current) {
      return;
    }

    const target = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      {
        // Trigger when the sentinel gets near the top of the viewport
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      },
    );

    observer.observe(target);
    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }
    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          model: model,
        },
      },
    );
    setInput("");
  };

  return (
    <div className="flex h-full flex-col rounded-b-md bg-background pb-3 pl-3">
      <Conversation className="h-full">
        <ConversationContent>
          {hasNextPage && (
            <div
              className="flex justify-center py-2 text-muted-foreground text-xs"
              ref={loadMoreRef}
            >
              {isFetchingNextPage
                ? "Loading more messages..."
                : "Scroll up to load previous messages"}
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === "assistant" &&
                message.parts.filter((part) => part.type === "source-url")
                  .length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === "source-url",
                        ).length
                      }
                    />
                    {message.parts
                      .filter((part) => part.type === "source-url")
                      .map((part, i) => (
                        <SourcesContent key={`${message.id}-${i}`}>
                          <Source
                            href={part.url}
                            key={`${message.id}-${i}`}
                            title={part.url}
                          />
                        </SourcesContent>
                      ))}
                  </Sources>
                )}
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case "text":
                    return (
                      <Fragment key={`${message.id}-${i}`}>
                        <Message from={message.role}>
                          <MessageContent>
                            <Response>{part.text}</Response>
                          </MessageContent>
                        </Message>
                        {message.role === "assistant" &&
                          i === messages.length - 1 && (
                            <Actions className="mt-2">
                              <Action
                                label="Retry"
                                onClick={() => regenerate()}
                              >
                                <RefreshCcw className="size-3" />
                              </Action>
                              <Action
                                label="Copy"
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                              >
                                <Copy className="size-3" />
                              </Action>
                            </Actions>
                          )}
                      </Fragment>
                    );
                  case "reasoning":
                    return (
                      <Reasoning
                        className="w-full"
                        isStreaming={
                          status === "streaming" &&
                          i === message.parts.length - 1 &&
                          message.id === messages.at(-1)?.id
                        }
                        key={`${message.id}-${i}`}
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>{part.text}</ReasoningContent>
                      </Reasoning>
                    );
                  case "file": {
                    return (
                      <TaskItemFile>
                        <File className="size-4" />
                        <span>{part.filename}</span>
                      </TaskItemFile>
                    );
                  }
                  case "tool-google_search_console_query": {
                    if (
                      !part.output?.success &&
                      part.output?.next_step === NO_SEARCH_CONSOLE_ERROR_MESSAGE
                    ) {
                      return null;
                    }
                    return (
                      <Tool defaultOpen={false}>
                        <ToolHeader state={part.state} type={part.type} />
                        <ToolContent>
                          <ToolInput input={part.input} />
                          <ToolOutput
                            errorText={part.errorText}
                            output={JSON.stringify(
                              part.output as object,
                              null,
                              2,
                            )}
                          />
                        </ToolContent>
                      </Tool>
                    );
                  }
                  case "tool-manage_google_search_property": {
                    return (
                      <Message from={message.role}>
                        <MessageContent>
                          <GscConnectionCard
                            organizationId={organizationId}
                            projectId={projectId}
                          />
                        </MessageContent>
                      </Message>
                    );
                  }
                  case "tool-ls":
                  case "tool-cat":
                  case "tool-rm":
                  case "tool-mv":
                  case "tool-write_file":
                  case "tool-get_serp_for_keyword":
                  case "tool-get_keywords_overview":
                  case "tool-get_keyword_suggestions":
                  case "tool-get_ranked_pages_for_site":
                  case "tool-get_ranked_keywords_for_site": {
                    return (
                      <Tool defaultOpen={false}>
                        <ToolHeader state={part.state} type={part.type} />
                        <ToolContent>
                          <ToolInput input={part.input} />
                          <ToolOutput
                            errorText={part.errorText}
                            output={JSON.stringify(part.output, null, 2)}
                          />
                        </ToolContent>
                      </Tool>
                    );
                  }
                  default:
                    return null;
                }
              })}
            </div>
          ))}
          {status === "submitted" && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput className="pr-3" globalDrop multiple onSubmit={handleSubmit}>
        <PromptInputBody>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <PromptInputModelSelect
              onValueChange={(value) => {
                setModel(value);
              }}
              value={model}
            >
              <PromptInputModelSelectTrigger>
                <PromptInputModelSelectValue />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                {models.map((model) => (
                  <PromptInputModelSelectItem
                    key={model.value}
                    value={model.value}
                  >
                    {model.name}
                  </PromptInputModelSelectItem>
                ))}
              </PromptInputModelSelectContent>
            </PromptInputModelSelect>
          </PromptInputTools>
          <PromptInputSubmit
            disabled={!input && !status}
            onClick={() => {
              if (status === "streaming") {
                stop?.();
              }
            }}
            status={status}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
