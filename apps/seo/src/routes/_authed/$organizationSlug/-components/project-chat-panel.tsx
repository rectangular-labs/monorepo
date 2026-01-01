"use client";

import { useChat } from "@ai-sdk/react";
import { eventIteratorToUnproxiedDataStream } from "@rectangular-labs/api-seo/client";
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
  Queue,
  QueueItem,
  QueueItemContent,
  QueueItemDescription,
  QueueItemIndicator,
  QueueList,
  QueueSection,
  QueueSectionContent,
  QueueSectionLabel,
  QueueSectionTrigger,
} from "@rectangular-labs/ui/components/ai-elements/queue";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@rectangular-labs/ui/components/ai-elements/reasoning";
import { Response } from "@rectangular-labs/ui/components/ai-elements/response";
import { Shimmer } from "@rectangular-labs/ui/components/ai-elements/shimmer";
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
  RefreshCcw,
  X,
} from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Checkbox } from "@rectangular-labs/ui/components/ui/checkbox";
import {
  DialogDrawer,
  DialogDrawerFooter,
  DialogDrawerHeader,
  DialogDrawerTitle,
} from "@rectangular-labs/ui/components/ui/dialog-drawer";
import { Label } from "@rectangular-labs/ui/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@rectangular-labs/ui/components/ui/radio-group";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
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
  manage_todo: { title: "Manage Task list" },
  make_suggestions: { title: "Make suggestions", defaultOpen: true },
};

function focusChatTextarea() {
  requestAnimationFrame(() => {
    const textarea = document.querySelector<HTMLTextAreaElement>(
      'textarea[name="message"]',
    );
    textarea?.focus();
  });
}

function AskQuestionsToolPart({
  part,
  onSubmitAnswers,
}: {
  part: ChatToolPart;
  onSubmitAnswers: (text: string) => void;
}) {
  const [answers, setAnswers] = useState<
    Record<string, { selected: string[] }>
  >(() => {
    const initial: Record<string, { selected: string[] }> = {};
    const questions =
      part.input && "questions" in part.input
        ? (part.input.questions ?? [])
        : [];
    for (const q of questions) {
      if (!q?.id) continue;
      initial[q.id] = { selected: [] };
    }
    return initial;
  });
  if (
    part.type !== "tool-ask_questions" ||
    part.state === "input-streaming" ||
    part.state === "output-error"
  )
    return null;
  const { questions } = part.input;

  const canSubmit =
    questions.length > 0 &&
    questions.every((q) => (answers[q.id]?.selected?.length ?? 0) > 0);

  const submit = () => {
    const lines: string[] = [];
    lines.push("Answers to ask_questions:");
    for (const q of questions) {
      const selected = answers[q.id]?.selected ?? [];
      lines.push(`- ${q.id}: ${selected.join(", ")}`);
    }
    onSubmitAnswers(lines.join("\n"));
  };

  return (
    <div className="mb-4 w-full rounded-md border bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="font-medium text-sm">Please answer these questions</div>
        <div className="text-muted-foreground text-xs">
          {questions.length} question{questions.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q) => {
          const selected = answers[q.id]?.selected ?? [];
          const allowMultiple = q.allow_multiple === true;

          return (
            <div className="space-y-2" key={q.id}>
              <div className="font-medium text-sm">{q.prompt}</div>

              {allowMultiple ? (
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const checked = selected.includes(opt.id);
                    const checkboxId = `${q.id}:${opt.id}`;
                    return (
                      <div className="flex items-center gap-2" key={opt.id}>
                        <Checkbox
                          checked={checked}
                          id={checkboxId}
                          onCheckedChange={(next) => {
                            const isChecked = next === true;
                            setAnswers((prev) => {
                              const current = prev[q.id]?.selected ?? [];
                              const nextSelected = isChecked
                                ? Array.from(new Set([...current, opt.id]))
                                : current.filter((id) => id !== opt.id);
                              return {
                                ...prev,
                                [q.id]: { selected: nextSelected },
                              };
                            });
                          }}
                        />
                        <Label className="cursor-pointer" htmlFor={checkboxId}>
                          {opt.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <RadioGroup
                  onValueChange={(value) => {
                    setAnswers((prev) => ({
                      ...prev,
                      [q.id]: { selected: value ? [value] : [] },
                    }));
                  }}
                  value={selected[0] ?? ""}
                >
                  {q.options.map((opt) => (
                    <div className="flex items-center gap-2" key={opt.id}>
                      <RadioGroupItem id={`${q.id}:${opt.id}`} value={opt.id} />
                      <Label
                        className="cursor-pointer"
                        htmlFor={`${q.id}:${opt.id}`}
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          disabled={!canSubmit || part.state !== "output-available"}
          onClick={submit}
          size="sm"
          type="button"
        >
          Submit answers
        </Button>
      </div>
    </div>
  );
}

function CreatePlanToolPart({
  part,
  onApprove,
  onReject,
}: {
  part: ChatToolPart;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (
    part.type !== "tool-create_plan" ||
    part.state === "input-streaming" ||
    part.state === "output-error"
  )
    return null;
  const plan = part.input;
  const title = plan.name?.trim() || "Proposed plan";
  const overview = plan.overview?.trim();
  const markdown = plan.plan ?? "";

  return (
    <div className="mb-4 w-full rounded-md border bg-background p-4">
      <DialogDrawer
        onOpenChange={setOpen}
        open={open}
        trigger={
          <button
            className={cn(
              "w-full text-left",
              "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-sm">{title}</div>
                {overview ? (
                  <div className="mt-1 line-clamp-2 text-muted-foreground text-xs">
                    {overview}
                  </div>
                ) : (
                  <div className="mt-1 text-muted-foreground text-xs">
                    Click to view details
                  </div>
                )}
              </div>
              <div className="shrink-0 text-muted-foreground text-xs">
                {part.state === "output-available" ? "Ready" : "Running"}
              </div>
            </div>
          </button>
        }
      >
        <DialogDrawerHeader className="space-y-1">
          <DialogDrawerTitle>{title}</DialogDrawerTitle>
          {overview ? (
            <div className="text-muted-foreground text-sm">{overview}</div>
          ) : null}
        </DialogDrawerHeader>

        <div className="max-h-[60vh] overflow-auto px-4 pb-4">
          <Response>{markdown}</Response>
        </div>

        <DialogDrawerFooter className="gap-2">
          <Button
            disabled={part.state !== "output-available"}
            onClick={() => {
              setOpen(false);
              onReject();
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Reject
          </Button>
          <Button
            disabled={part.state !== "output-available"}
            onClick={() => {
              setOpen(false);
              onApprove();
            }}
            size="sm"
            type="button"
          >
            Approve
          </Button>
        </DialogDrawerFooter>
      </DialogDrawer>

      <div className="mt-3 flex justify-end gap-2">
        <Button
          disabled={part.state !== "output-available"}
          onClick={onReject}
          size="sm"
          type="button"
          variant="outline"
        >
          Reject
        </Button>
        <Button
          disabled={part.state !== "output-available"}
          onClick={onApprove}
          size="sm"
          type="button"
        >
          Approve
        </Button>
      </div>
    </div>
  );
}

type TodoSnapshot = Extract<
  Extract<ChatMessagePart, { type: `tool-manage_todo` }>,
  { state: `output-available` }
>["output"]["todos"];
export function ProjectChatPanel() {
  const { close, currentPage, organizationIdentifier, projectId } =
    useProjectChat();
  const [input, setInput] = useState("");
  const queryClient = useQueryClient();
  const lastSuggestionCompletionRef = useRef<string | null>(null);
  const lastTodoSnapshotRef = useRef<string | null>(null);
  const [todoSnapshot, setTodoSnapshot] = useState<NonNullable<TodoSnapshot>>(
    [],
  );

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

  useEffect(() => {
    for (const message of messages) {
      for (let i = 0; i < message.parts.length; i++) {
        const part = message.parts[i];
        if (!part || !isChatToolPart(part)) continue;
        const toolName = part.type.slice("tool-".length);

        if (toolName === "make_suggestions") {
          if (part.state !== "output-available") continue;
          const key = `${message.id}:${i}`;
          if (lastSuggestionCompletionRef.current === key) continue;
          lastSuggestionCompletionRef.current = key;
          void queryClient.invalidateQueries({ queryKey: ["pullDocument"] });
        }

        if (toolName === "manage_todo") {
          if (part.state !== "output-available") continue;
          const key = `${message.id}:${i}`;
          if (lastTodoSnapshotRef.current === key) continue;
          lastTodoSnapshotRef.current = key;
          const output = part.output as { todos?: TodoSnapshot } | undefined;
          if (output?.todos) {
            setTodoSnapshot(output.todos);
          }
        }
      }
    }
  }, [messages, queryClient]);

  const sendText = (text: string) => {
    sendMessage({ text }, { body: {} });
    setInput("");
  };

  const rejectPlanPrefill = () => {
    setInput("Let's change the following:\n1. ");
    focusChatTextarea();
  };

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

  const openTodos = useMemo(() => {
    return todoSnapshot.filter((t) => t.status === "open");
  }, [todoSnapshot]);

  const doneTodos = useMemo(() => {
    return todoSnapshot.filter((t) => t.status === "done");
  }, [todoSnapshot]);

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
                        count={
                          message.parts.filter((p) => p.type === "source-url")
                            .length
                        }
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
                    case "file":
                      return (
                        <TaskItemFile key={`${message.id}-${i}`}>
                          <File className="size-4" />
                          <span>{part.filename}</span>
                        </TaskItemFile>
                      );
                    case "tool-ask_questions": {
                      if (part.state === "output-available") {
                        return (
                          <AskQuestionsToolPart
                            key={`${message.id}-${part.toolCallId}`}
                            onSubmitAnswers={(text) => sendText(text)}
                            part={part}
                          />
                        );
                      }
                      return <Shimmer>Drilling into the details</Shimmer>;
                    }
                    case "tool-create_plan": {
                      if (part.state === "output-available") {
                        return (
                          <CreatePlanToolPart
                            key={`${message.id}-${part.toolCallId}`}
                            onApprove={() =>
                              sendText("plan looks good, let's start.")
                            }
                            onReject={() => rejectPlanPrefill()}
                            part={part}
                          />
                        );
                      }
                      return <Shimmer>Creating plan</Shimmer>;
                    }
                    case "tool-manage_todo": {
                      if (part.state !== "output-available") {
                        return <Shimmer>Managing tasks</Shimmer>;
                      }
                      return null;
                    }
                    default: {
                      if (!isChatToolPart(part)) return null;
                      const toolName = part.type.slice("tool-".length);
                      const ui = TOOL_UI[toolName];
                      const title = ui?.title;
                      const defaultOpen =
                        part.state === "output-error" ||
                        ui?.defaultOpen === true;

                      return (
                        <Tool
                          defaultOpen={defaultOpen}
                          key={`${message.id}-${i}`}
                        >
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

        <div className="border-t">
          {(openTodos.length > 0 || doneTodos.length > 0) && (
            <div className="px-3 pt-2">
              <Queue>
                <QueueSection defaultOpen={openTodos.length > 0}>
                  <QueueSectionTrigger>
                    <QueueSectionLabel count={openTodos.length} label="Open" />
                  </QueueSectionTrigger>
                  <QueueSectionContent>
                    <QueueList>
                      {openTodos.map((t) => (
                        <QueueItem key={t.id}>
                          <div className="flex items-start gap-2">
                            <QueueItemIndicator completed={false} />
                            <QueueItemContent>{t.title}</QueueItemContent>
                          </div>
                          {t.notes ? (
                            <QueueItemDescription>
                              {t.notes}
                            </QueueItemDescription>
                          ) : null}
                        </QueueItem>
                      ))}
                    </QueueList>
                  </QueueSectionContent>
                </QueueSection>

                <QueueSection defaultOpen={false}>
                  <QueueSectionTrigger>
                    <QueueSectionLabel
                      count={doneTodos.length}
                      label="Completed"
                    />
                  </QueueSectionTrigger>
                  <QueueSectionContent>
                    <QueueList>
                      {doneTodos.map((t) => (
                        <QueueItem key={t.id}>
                          <div className="flex items-start gap-2">
                            <QueueItemIndicator completed />
                            <QueueItemContent completed>
                              {t.title}
                            </QueueItemContent>
                          </div>
                          {t.notes ? (
                            <QueueItemDescription completed>
                              {t.notes}
                            </QueueItemDescription>
                          ) : null}
                        </QueueItem>
                      ))}
                    </QueueList>
                  </QueueSectionContent>
                </QueueSection>
              </Queue>
            </div>
          )}

          <PromptInput
            className="px-3 py-2"
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
    </div>
  );
}
