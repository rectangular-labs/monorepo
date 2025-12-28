"use client";

import { useChat } from "@ai-sdk/react";
import type { SeoChatMessage } from "@rectangular-labs/api-seo/types";
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
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Copy, File, RefreshCcw, X } from "@rectangular-labs/ui/components/icon";
import { eventIteratorToUnproxiedDataStream } from "@orpc/client";
import { Fragment, useMemo, useState } from "react";
import { getApiClient } from "~/lib/api";
import { useProjectChat } from "./project-chat-provider";

type ChatMessagePart = SeoChatMessage["parts"][number];
type ChatToolPart = Extract<ChatMessagePart, { type: `tool-${string}` }>;

function isChatToolPart(part: ChatMessagePart): part is ChatToolPart {
  return part.type.startsWith("tool-");
}

const TOOL_UI: Record<string, { title: string; defaultOpen?: boolean }> = {
  read_skills: { title: "Read skills" },
  use_skills: { title: "Use skill" },
  ask_questions: { title: "Ask questions", defaultOpen: true },
  create_plan: { title: "Create plan", defaultOpen: true },
  get_historical_messages: { title: "Get historical messages" },
  get_message_detail: { title: "Get message detail" },
  manage_todo: { title: "Manage todos" },
};

export function ProjectChatPanel() {
  const { close, currentPage, organizationIdentifier, projectId } =
    useProjectChat();
  const [input, setInput] = useState("");

  const api = useMemo(() => getApiClient(), []);

  const { messages, sendMessage, status, regenerate, stop } =
    useChat<SeoChatMessage>({
      transport: {
        reconnectToStream: async () => null,
        sendMessages: async ({ abortSignal, messages }) => {
          if (!organizationIdentifier || !projectId) {
            throw new Error("Project chat requires an active project.");
          }
          const eventIterator = await api.project.chat(
            {
              organizationIdentifier,
              projectId,
              currentPage,
              messages,
              model: undefined,
            },
            { signal: abortSignal },
          );
          return eventIteratorToUnproxiedDataStream(eventIterator);
        },
      },
      onError: (error) => {
        console.error("project chat error", error);
      },
      id: projectId ?? "project",
    });

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) return;

    sendMessage(
      { text: message.text || "Sent with attachments", files: message.files },
      { body: {} },
    );
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="min-w-0">
          <div className="truncate font-medium text-sm">Assistant</div>
          <div className="truncate text-muted-foreground text-xs">
            Context: {currentPage}
          </div>
        </div>
        <Button
          aria-label="Close chat"
          onClick={() => close()}
          size="icon"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === "assistant" &&
                  message.parts.some((p) => p.type === "source-url") && (
                    <Sources>
                      <SourcesTrigger
                        count={message.parts.filter((p) => p.type === "source-url").length}
                      />
                      {message.parts
                        .filter((p) => p.type === "source-url")
                        .map((part, i) => (
                          <SourcesContent key={`${message.id}-${i}`}>
                            <Source href={part.url} title={part.url} />
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
                            message.id === messages.at(-1)?.id &&
                            i === message.parts.length - 1 && (
                              <Actions className="mt-2">
                                <Action label="Retry" onClick={() => regenerate()}>
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
                    case "file":
                      return (
                        <TaskItemFile key={`${message.id}-${i}`}>
                          <File className="size-4" />
                          <span>{part.filename}</span>
                        </TaskItemFile>
                      );
                    default: {
                      if (!isChatToolPart(part)) return null;
                      const toolName = part.type.slice("tool-".length);
                      const ui = TOOL_UI[toolName];
                      const title = ui?.title;
                      const defaultOpen =
                        part.state === "output-error" || ui?.defaultOpen === true;

                      return (
                        <Tool defaultOpen={defaultOpen} key={`${message.id}-${i}`}>
                          <ToolHeader
                            state={part.state}
                            title={title}
                            type={part.type}
                          />
                          <ToolContent>
                            <ToolInput input={part.input} />
                            <ToolOutput
                              errorText={part.errorText}
                              output={part.output}
                            />
                          </ToolContent>
                        </Tool>
                      );
                    }
                  }
                })}
              </div>
            ))}

            {status === "submitted" && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput
          className="border-t px-3 py-2"
          globalDrop
          multiple
          onSubmit={handleSubmit}
        >
          <PromptInputBody>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              status={status}
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
            </PromptInputTools>
            <PromptInputSubmit
              disabled={!input && status === "ready"}
              onClick={() => {
                if (status === "streaming") stop?.();
              }}
              status={status}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}


