"use client";

import { useChat } from "@ai-sdk/react";
import { eventIteratorToUnproxiedDataStream } from "@rectangular-labs/api-seo/client";
import type { SeoChatMessage } from "@rectangular-labs/api-seo/types";
import type { ProjectChatCurrentPage } from "@rectangular-labs/core/schemas/project-chat-parsers";
import {
  Action,
  Actions,
} from "@rectangular-labs/ui/components/ai-elements/actions";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@rectangular-labs/ui/components/ai-elements/conversation";
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
import {
  Suggestion,
  Suggestions,
} from "@rectangular-labs/ui/components/ai-elements/suggestion";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "@rectangular-labs/ui/components/ai-elements/task";
import {
  Copy,
  File,
  History,
  Pencil,
  RefreshCcw,
  Search,
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
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerLabel,
  DropDrawerSeparator,
  DropDrawerTrigger,
} from "@rectangular-labs/ui/components/ui/dropdrawer";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@rectangular-labs/ui/components/ui/input-group";
import { Kbd, KbdGroup } from "@rectangular-labs/ui/components/ui/kbd";
import { Label } from "@rectangular-labs/ui/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@rectangular-labs/ui/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@rectangular-labs/ui/components/ui/tooltip";
import { useIsApple } from "@rectangular-labs/ui/hooks/use-apple";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { getApiClient, getApiClientRq } from "~/lib/api";
import { useProjectChat } from "./project-chat-provider";

type ChatMessagePart = SeoChatMessage["parts"][number];
type ChatToolPart = Extract<ChatMessagePart, { type: `tool-${string}` }>;

function AskQuestionsToolPart({
  part,
  onSubmitAnswers,
}: {
  part: ChatToolPart;
  onSubmitAnswers: (text: string) => void;
}) {
  const [answers, setAnswers] = useState<
    Record<string, { selected: string[]; otherText: string }>
  >(() => {
    const initial: Record<string, { selected: string[]; otherText: string }> =
      {};
    const questions =
      part.input && "questions" in part.input
        ? (part.input.questions ?? [])
        : [];
    for (const q of questions) {
      if (!q?.id) continue;
      initial[q.id] = { selected: [], otherText: "" };
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
    questions.every((q) => {
      const answer = answers[q.id];
      if (!answer || (answer.selected?.length ?? 0) === 0) return false;
      if (answer.selected.includes("other") && !answer.otherText.trim())
        return false;
      return true;
    });

  const submit = () => {
    const lines: string[] = [];
    lines.push("Answers to the questions proposed:");
    for (const q of questions) {
      const selectedIds = answers[q.id]?.selected ?? [];
      const otherText = answers[q.id]?.otherText ?? "";
      const selected = selectedIds.map((id) =>
        id === "other" ? otherText : id,
      );
      lines.push(`- ${q.id}: ${selected.join(", ")}`);
    }
    onSubmitAnswers(lines.join("\n"));
  };

  return (
    <div className="mb-4 w-full rounded-md border bg-background p-4">
      <div className="space-y-4">
        <div className="font-medium text-sm">Quick questions</div>

        {questions.map((q) => {
          const selected = answers[q.id]?.selected ?? [];
          const allowMultiple = q.allow_multiple === true;
          const hasOther = q.options.some((o) => o.id === "other");
          const options = hasOther
            ? q.options
            : [...q.options, { id: "other", label: "Other" }];

          return (
            <div className="space-y-2" key={q.id}>
              <div className="font-medium text-sm">{q.prompt}</div>

              {allowMultiple ? (
                <div className="space-y-2">
                  {options.map((opt) => {
                    const checked = selected.includes(opt.id);
                    const checkboxId = `${q.id}:${opt.id}`;
                    const isOther = opt.id === "other";

                    return (
                      <div key={opt.id}>
                        <div className="flex items-center gap-2">
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
                                  [q.id]: {
                                    selected: nextSelected,
                                    otherText: prev[q.id]?.otherText ?? "",
                                  },
                                };
                              });
                            }}
                          />
                          <Label
                            className="cursor-pointer"
                            htmlFor={checkboxId}
                          >
                            {opt.label}
                          </Label>
                        </div>
                        {isOther && checked && (
                          <div className="mt-2 ml-6">
                            <Input
                              onChange={(e) => {
                                setAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: {
                                    selected: prev[q.id]?.selected ?? [],
                                    otherText: e.target.value,
                                  },
                                }));
                              }}
                              placeholder="Please specify..."
                              value={answers[q.id]?.otherText ?? ""}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <RadioGroup
                  onValueChange={(value) => {
                    setAnswers((prev) => ({
                      ...prev,
                      [q.id]: {
                        selected: value ? [value] : [],
                        otherText: prev[q.id]?.otherText ?? "",
                      },
                    }));
                  }}
                  value={selected[0] ?? ""}
                >
                  {options.map((opt) => {
                    const isOther = opt.id === "other";
                    const isSelected = selected.includes(opt.id);

                    return (
                      <div className="space-y-2" key={opt.id}>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem
                            id={`${q.id}:${opt.id}`}
                            value={opt.id}
                          />
                          <Label
                            className="cursor-pointer"
                            htmlFor={`${q.id}:${opt.id}`}
                          >
                            {opt.label}
                          </Label>
                        </div>
                        {isOther && isSelected && (
                          <div className="ml-6">
                            <Input
                              onChange={(e) => {
                                setAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: {
                                    selected: prev[q.id]?.selected ?? [],
                                    otherText: e.target.value,
                                  },
                                }));
                              }}
                              placeholder="Please specify..."
                              value={answers[q.id]?.otherText ?? ""}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
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
function inferCurrentPage(pathname: string): ProjectChatCurrentPage {
  if (pathname.includes("/content")) return "content-list";
  if (pathname.includes("/settings")) return "settings";
  return "stats";
}
function ChatConversation({
  organizationId,
  projectId,
  chatId,
  onAdoptChatId,
  initialMessages,
  input,
  setInput,
  isMessagesLoading,
}: {
  organizationId: string;
  projectId: string;
  chatId: string | null;
  initialMessages: SeoChatMessage[];
  onAdoptChatId: (nextChatId: string) => void;
  input: string;
  setInput: (input: string) => void;
  isMessagesLoading: boolean;
  hasChat: boolean;
}) {
  const { pathname } = useLocation();
  const currentPage = inferCurrentPage(pathname);

  const queryClient = useQueryClient();
  const todoSnapshotSetRef = useRef<Set<string>>(new Set());
  const [todoSnapshot, setTodoSnapshot] = useState<NonNullable<TodoSnapshot>>(
    [],
  );
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatIdRef = useRef<string | null>(chatId);

  const { messages, setMessages, sendMessage, status, regenerate, stop } =
    useChat<SeoChatMessage>({
      ...(!!chatIdRef.current && !isMessagesLoading
        ? {
            id: chatIdRef.current,
            messages: initialMessages,
          }
        : {}),
      transport: {
        reconnectToStream: async () => null,
        sendMessages: async ({ abortSignal, messages, messageId, trigger }) => {
          console.log("messageId", messageId, trigger);
          const eventIterator = await getApiClient().chat.sendMessage(
            {
              organizationId,
              projectId,
              currentPage,
              messages,
              chatId: chatIdRef.current,
              messageId,
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
      onToolCall: ({ toolCall }) => {
        console.log("toolCall", toolCall);
      },
      onFinish: ({ message }) => {
        const createdChatId = message.metadata?.chatId ?? null;
        if (!createdChatId || !!chatIdRef.current) return;
        onAdoptChatId(createdChatId);
      },
    });

  useEffect(() => {
    chatIdRef.current = chatId;
    if (!chatId) {
      setMessages([]);
    }
    setTodoSnapshot([]);
    todoSnapshotSetRef.current.clear();
  }, [chatId, setMessages]);

  useEffect(() => {
    for (const message of messages) {
      for (const part of message.parts) {
        if (
          part.type === "tool-use_skills" &&
          part.state === "output-available" &&
          (part.input.skill === "create_articles" ||
            part.input.skill === "write_file")
        ) {
          void queryClient.invalidateQueries({
            queryKey: getApiClientRq().content.list.key({
              type: "query",
            }),
          });
        }

        if (
          part.type === "tool-manage_todo" &&
          part.state === "output-available" &&
          !todoSnapshotSetRef.current.has(part.toolCallId)
        ) {
          todoSnapshotSetRef.current.add(part.toolCallId);
          if (part.output.todos) {
            setTodoSnapshot(part.output.todos);
          }
        }
      }
    }
  }, [messages, queryClient]);

  const rejectPlanPrefill = () => {
    setInput("Let's change the following:\n1. ");
    textareaRef.current?.focus();
  };

  const handleSuggestion = (suggestion: string) => {
    if (isMessagesLoading) return;
    handleSubmit({ text: suggestion });
  };

  const handleSubmit = (message: PromptInputMessage) => {
    if (isMessagesLoading) return;
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) return;

    sendMessage(
      { text: message.text || "Sent with attachments", files: message.files },
      { body: {} },
    );
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const openTodos = useMemo(() => {
    return todoSnapshot.filter((t) => t.status === "open");
  }, [todoSnapshot]);

  const isInputDisabled = isMessagesLoading;
  const showMessagesLoading = isMessagesLoading && messages.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex min-h-0 flex-1 flex-col">
        <Conversation className="h-full">
          <ConversationContent>
            {showMessagesLoading && <Shimmer>Loading messages…</Shimmer>}
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
                                  onClick={() =>
                                    regenerate({ messageId: message.id })
                                  }
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
                    case "reasoning": {
                      return (
                        <Reasoning
                          className="w-full"
                          defaultOpen={false}
                          isStreaming={part.state !== "done"}
                          key={`${message.id}-${i}`}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    }
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
                            onSubmitAnswers={(text) => handleSubmit({ text })}
                            part={part}
                          />
                        );
                      }
                      return (
                        <Shimmer className="text-sm" key={part.toolCallId}>
                          Drilling into the details
                        </Shimmer>
                      );
                    }
                    case "tool-create_plan": {
                      if (part.state === "output-available") {
                        return (
                          <CreatePlanToolPart
                            key={`${message.id}-${part.toolCallId}`}
                            onApprove={() =>
                              handleSubmit({
                                text: "plan looks good, let's start.",
                              })
                            }
                            onReject={() => rejectPlanPrefill()}
                            part={part}
                          />
                        );
                      }
                      return <Shimmer>Creating plan</Shimmer>;
                    }
                    case "tool-manage_todo": {
                      if (part.state === "input-streaming") {
                        return (
                          <Shimmer
                            className="mb-4 text-sm"
                            key={part.toolCallId}
                          >
                            Managing tasks
                          </Shimmer>
                        );
                      }

                      if (part.state === "input-available") {
                        const { action } = part.input;
                        const actionLabel = (() => {
                          switch (action) {
                            case "create":
                              return "Creating task";
                            case "update":
                              return "Updating task";
                            case "list":
                              return "Listing tasks";
                          }
                        })();
                        return (
                          <Shimmer
                            className="mb-4 text-sm"
                            key={part.toolCallId}
                          >
                            {actionLabel}
                          </Shimmer>
                        );
                      }

                      if (part.state === "output-available") {
                        const { action } = part.input;
                        const actionLabel = (() => {
                          switch (action) {
                            case "create":
                              return `Creating task ${part.input.todo?.title}`;
                            case "update":
                              return `Updating task`;
                            case "list":
                              return "Listed tasks";
                          }
                        })();
                        return (
                          <div
                            className="mb-4 text-muted-foreground text-sm"
                            key={part.toolCallId}
                          >
                            {actionLabel}
                          </div>
                        );
                      }
                      return (
                        <div
                          className="mb-4 text-muted-foreground text-sm"
                          key={`${message.id}-${part.toolCallId}`}
                        >
                          Something went wrong managing tasks
                        </div>
                      );
                    }
                    case "tool-read_skills": {
                      if (part.state === "output-available") {
                        const skillName = part.input.skill.replaceAll("_", " ");
                        return (
                          <div
                            className="mb-4 text-muted-foreground text-sm"
                            key={`${message.id}-${part.toolCallId}`}
                          >
                            Done reading skill {skillName}.
                          </div>
                        );
                      }
                      return (
                        <Shimmer
                          className="mb-4 text-sm"
                          key={`${message.id}-${part.toolCallId}`}
                        >
                          Reading skill...
                        </Shimmer>
                      );
                    }

                    case "tool-use_skills": {
                      const taskName =
                        part.input?.taskName?.trim() || "Executing Task";
                      const state = (() => {
                        switch (part.state) {
                          case "output-available": {
                            const result = (() => {
                              if (part.output?.success) {
                                return part.output?.result ?? "Completed";
                              }
                              return "Failed";
                            })();
                            return result;
                          }
                          case "output-error":
                            return part.errorText;
                          default:
                            return part.input?.instructions ?? "Running";
                        }
                      })();
                      const isRunning =
                        part.state !== "output-available" &&
                        part.state !== "output-error";
                      return (
                        <Task
                          className="mb-4"
                          defaultOpen={false}
                          key={`${message.id}-${i}`}
                        >
                          {isRunning ? (
                            <Shimmer className="text-sm" key={part.toolCallId}>
                              {taskName}
                            </Shimmer>
                          ) : (
                            <TaskTrigger title={taskName} />
                          )}
                          <TaskContent>
                            <TaskItem>{state}</TaskItem>
                          </TaskContent>
                        </Task>
                      );
                    }

                    default: {
                      return null;
                    }
                  }
                })}
              </div>
            ))}

            {status === "submitted" && (
              <Shimmer className="text-sm"> Preparing response...</Shimmer>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t">
          {messages.length === 0 && (
            <Suggestions className="px-3 pt-3">
              <Suggestion
                onClick={handleSuggestion}
                suggestion="How is the site doing lately?"
              />
              <Suggestion
                onClick={handleSuggestion}
                suggestion="I want to create a new SEO strategy."
              />
            </Suggestions>
          )}
          {openTodos.length > 0 && (
            <div className="px-3 pt-2">
              <Queue>
                <QueueSection defaultOpen={false}>
                  <QueueSectionTrigger>
                    <QueueSectionLabel count={openTodos.length} label="Tasks" />
                  </QueueSectionTrigger>
                  <QueueSectionContent>
                    <QueueList>
                      {openTodos.map((t) => (
                        <QueueItem key={t.id}>
                          <div className="flex items-start gap-2">
                            <QueueItemIndicator
                              className="shrink-0"
                              completed={false}
                            />
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
                disabled={isInputDisabled}
                onChange={(e) => setInput(e.target.value)}
                ref={textareaRef}
                status={status}
                value={input}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger disabled={isInputDisabled} />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments
                      disabled={isInputDisabled}
                    />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={isInputDisabled || (!input && status === "ready")}
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

export function ProjectChatPanel() {
  const {
    historyOpen,
    setHistoryOpen,
    close,
    organizationId,
    projectId,
    activeChatId,
    activeChat,
    isActiveChatLoading,
    startNewChat,
    selectChat,
    adoptChatId,
    chatList,
    isChatListLoading,
    refetchChatList,
    chatMessages,
    isChatMessagesFetching,
    input,
    setInput,
  } = useProjectChat();
  const isApple = useIsApple();
  const [historySearch, setHistorySearch] = useState("");
  const [modKeyLabel, setModKeyLabel] = useState<"⌘" | "Ctrl">("Ctrl");

  useEffect(() => {
    setModKeyLabel(isApple ? "⌘" : "Ctrl");
  }, [isApple]);

  const historyChats = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return chatList;
    return chatList.filter((c) => c.title.toLowerCase().includes(q));
  }, [chatList, historySearch]);

  const onHistoryOpenChange = (open: boolean) => {
    setHistoryOpen(open);
    if (open) {
      void refetchChatList();
    }
  };

  if (!organizationId || !projectId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Select a project to start chatting.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex min-w-0 items-center justify-between gap-2 border-b px-3">
        <div className="truncate font-medium text-sm">
          {activeChat?.title ?? "New chat"}
        </div>
        <div className="flex items-center gap-1">
          <DropDrawer onOpenChange={onHistoryOpenChange} open={historyOpen}>
            <DropDrawerTrigger asChild>
              <Button aria-label="Chat history" size="icon-sm" variant="ghost">
                <History className="size-4" />
              </Button>
            </DropDrawerTrigger>
            <DropDrawerContent align="end" className="md:w-80">
              <DropDrawerLabel>Chat history</DropDrawerLabel>
              <div className="p-2">
                <InputGroup>
                  <InputGroupAddon>
                    <Search className="size-4 text-muted-foreground" />
                  </InputGroupAddon>
                  <InputGroupInput
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search recent tasks"
                    value={historySearch}
                  />
                </InputGroup>
              </div>
              <DropDrawerSeparator />

              <div className="max-h-[50vh] overflow-auto">
                {isChatListLoading && (
                  <div className="p-2 text-muted-foreground text-sm">
                    Loading…
                  </div>
                )}
                {!isChatListLoading && historyChats.length === 0 && (
                  <div className="p-2 text-muted-foreground text-sm">
                    No chats yet.
                  </div>
                )}
                {historyChats.map((chat) => (
                  <DropDrawerItem
                    className={cn(
                      "flex flex-col items-start gap-0.5",
                      chat.id === activeChatId && "bg-muted",
                    )}
                    key={chat.id}
                    onSelect={() => selectChat(chat)}
                  >
                    <span className="max-w-full truncate font-medium text-sm">
                      {chat.title}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(chat.updatedAt).toLocaleString()}
                    </span>
                  </DropDrawerItem>
                ))}
              </div>
            </DropDrawerContent>
          </DropDrawer>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="New chat"
                onClick={startNewChat}
                size="icon-sm"
                variant="ghost"
              >
                <Pencil className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <KbdGroup>
                <span>Shortcut:</span>
                <Kbd>{modKeyLabel}</Kbd>
                <span>+</span>
                <Kbd>.</Kbd>
              </KbdGroup>
            </TooltipContent>
          </Tooltip>
          <Button
            aria-label="Close chat"
            onClick={() => close()}
            size="icon-sm"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <ChatConversation
        chatId={activeChatId}
        hasChat={isChatListLoading || chatList.length > 0}
        initialMessages={chatMessages}
        input={input}
        isMessagesLoading={
          !!activeChatId && (isChatMessagesFetching || isActiveChatLoading)
        }
        onAdoptChatId={adoptChatId}
        organizationId={organizationId}
        projectId={projectId}
        setInput={setInput}
      />
    </div>
  );
}
