"use client";
import { useChat } from "@ai-sdk/react";
import type { SeoChatMessage } from "@rectangular-labs/api-seo/types";
import { NO_SEARCH_CONSOLE_ERROR_MESSAGE } from "@rectangular-labs/db/parsers";
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
  PromptInputButton,
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
import {
  Copy,
  File,
  Globe,
  RefreshCcw,
} from "@rectangular-labs/ui/components/icon";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { WebsocketChatTransport } from "~/lib/ai-transport";
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
  const [webSearch, setWebSearch] = useState(false);

  const transport = new WebsocketChatTransport({
    url: `${typeof window !== "undefined" ? window.location.origin.replace("https", "wss") : "https://localhost:3000"}/api/realtime/organization/${organizationId}/project/${projectId}/campaign/${campaignId}/room`,
  });

  const { data: messagePages } = useInfiniteQuery(
    getApiClientRq().campaign.messages.infiniteOptions({
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

  const historyMessages = (messagePages?.pages ?? [])
    .flatMap((page) => page.data)
    .reverse() as SeoChatMessage[];

  const { messages, sendMessage, status, regenerate } = useChat<SeoChatMessage>(
    {
      // transport: {
      //   async sendMessages(options) {
      //     return eventIteratorToUnproxiedDataStream(
      //       await getApiClient().campaign.write(
      //         {
      //           id: campaignId,
      //           projectId,
      //           organizationId,
      //           chatId: options.chatId,
      //           messages: options.messages,
      //         },
      //         { signal: options.abortSignal },
      //       ),
      //     );
      //   },
      //   reconnectToStream() {
      //     throw new Error("Unsupported");
      //   },
      // },
      transport,
      onError: (error) => {
        console.error("error", error);
      },
      id: campaignId,
    },
  );
  const allMessages = [...historyMessages, ...messages];
  console.log("allMessages", allMessages);
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
          webSearch: webSearch,
        },
      },
    );
    setInput("");
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-md bg-background p-3">
      <Conversation className="h-full">
        <ConversationContent>
          {allMessages.map((message) => (
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

      <PromptInput globalDrop multiple onSubmit={handleSubmit}>
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
            <PromptInputButton
              onClick={() => setWebSearch(!webSearch)}
              variant={webSearch ? "default" : "ghost"}
            >
              <Globe size={16} />
              <span>Search</span>
            </PromptInputButton>
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
          <PromptInputSubmit disabled={!input && !status} status={status} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
