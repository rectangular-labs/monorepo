import { useChat } from "@ai-sdk/react";
import {
  ChatInput,
  ChatInputSubmit,
  ChatInputTextArea,
} from "@rectangular-labs/ui/components/chat/chat-input";
import {
  ChatMessage,
  ChatMessageAvatar,
  ChatMessageContent,
} from "@rectangular-labs/ui/components/chat/chat-message";
import { ChatMessageArea } from "@rectangular-labs/ui/components/chat/chat-message-area";
import { FilePreview } from "@rectangular-labs/ui/components/chat/file-preview";
import { TypingIndicator } from "@rectangular-labs/ui/components/chat/typing-indicator";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { ThemeToggle } from "@rectangular-labs/ui/components/theme-provider";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: ChatInterface,
});

function ChatInterface() {
  const [attachedFiles, setAttachedFiles] = useState<FileList | undefined>(
    undefined,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } =
    useChat({
      transport: {
        async sendMessages(options) {
          return eventIteratorToStream(
            await client.chat(
              {
                chatId: options.chatId,
                messages: options.messages,
              },
              { signal: options.abortSignal },
            ),
          );
        },
        reconnectToStream(options) {
          throw new Error("Unsupported");
        },
      },
    });
  console.log("messages", messages);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) {
      return;
    }
    const currentFileCount = attachedFiles?.length ?? 0;
    if (currentFileCount + files.length > 5) {
      alert("You can attach a maximum of 5 files.");
      return;
    }
    setAttachedFiles((prev) => {
      if (prev) {
        const dt = new DataTransfer();
        for (const file of prev) {
          dt.items.add(file);
        }
        for (const file of files) {
          dt.items.add(file);
        }
        return dt.files;
      }
      return files;
    });
  };

  const removeFile = (indexToRemove: number) => {
    if (!attachedFiles) return;
    const dt = new DataTransfer();
    let index = 0;
    for (const file of attachedFiles) {
      if (index !== indexToRemove) {
        dt.items.add(file);
      }
      index++;
    }

    const newFileList = dt.files.length > 0 ? dt.files : undefined;
    setAttachedFiles(newFileList);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFormSubmit = () => {
    handleSubmit(undefined, {
      experimental_attachments: attachedFiles ?? [],
    });
    setAttachedFiles(undefined);
  };
  return (
    <div className="flex h-screen flex-col">
      <ThemeToggle className="absolute top-4 right-4 z-10" />
      <div className="flex-1 overflow-y-auto">
        <ChatMessageArea>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pt-5 pb-5">
            {messages.map((message) => (
              <ChatMessage
                id={message.id}
                key={message.id}
                type={message.role === "user" ? "outgoing" : "incoming"}
                variant="full"
              >
                {message.role !== "user" && <ChatMessageAvatar />}
                <div>
                  {message.parts.map((part) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <ChatMessageContent
                            id={message.id}
                            key={JSON.stringify(part)}
                            messageContent={part.text}
                          />
                        );
                      case "file":
                        return (
                          <ChatMessageContent
                            id={message.id}
                            key={JSON.stringify(part)}
                            messageContent={[part]}
                          />
                        );
                      case "reasoning":
                        return (
                          <ChatMessageContent
                            id={message.id}
                            key={JSON.stringify(part)}
                            messageContent={part.reasoning}
                          />
                        );
                      case "source":
                        return (
                          <ChatMessageContent
                            id={message.id}
                            key={JSON.stringify(part)}
                            messageContent={part.source.url}
                          />
                        );
                      default:
                        return null;
                    }
                  })}
                  {message.experimental_attachments &&
                    message.experimental_attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {message.experimental_attachments
                          .filter((att) =>
                            att.contentType?.startsWith("image/"),
                          )
                          .map((attachment, index) => (
                            <img
                              alt={attachment.name ?? "image attachment"}
                              className="h-20 w-auto max-w-[150px] rounded object-contain"
                              key={`${message.id}-att-img-${index}`}
                              src={attachment.url}
                            />
                          ))}
                        {message.experimental_attachments
                          .filter(
                            (att) => !att.contentType?.startsWith("image/"),
                          )
                          .map((attachment, index) => (
                            <div
                              className="rounded border bg-muted/50 p-1 text-xs"
                              key={`${message.id}-att-file-${index}`}
                            >
                              📄 {attachment.name ?? "file"}
                            </div>
                          ))}
                      </div>
                    )}
                </div>
                {message.role === "user" && <ChatMessageAvatar />}
              </ChatMessage>
            ))}
            {isLoading && (
              <ChatMessage id="typing" type="incoming" variant="full">
                <ChatMessageAvatar />
                <TypingIndicator />
              </ChatMessage>
            )}
          </div>
        </ChatMessageArea>
      </div>

      <div className="flex w-full justify-center p-2">
        <div className="w-full max-w-3xl">
          <input
            accept="image/*,application/pdf,.doc,.docx,.txt,.md"
            className="hidden"
            multiple
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />

          {attachedFiles && attachedFiles.length > 0 && (
            <div className="flex max-h-20 flex-wrap gap-2 overflow-y-auto pb-2">
              {Array.from(attachedFiles).map((file, index) => (
                <FilePreview
                  file={file}
                  key={`${file.name}-${index}`}
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
          )}

          <ChatInput
            className="space-y-2"
            loading={isLoading}
            onChange={handleInputChange}
            onStop={stop}
            onSubmit={handleFormSubmit}
            rows={1}
            value={input}
            variant="default"
          >
            <ChatInputTextArea placeholder="Ask about Singapore trademark registration..." />
            <div className="flex w-full justify-between">
              <Button
                disabled={
                  isLoading || (attachedFiles && attachedFiles.length >= 5)
                }
                onClick={triggerFileInput}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Icons.Paperclip className="h-4 w-4" />
              </Button>
              <ChatInputSubmit
                className="rounded-full"
                onSubmit={handleFormSubmit}
                type="submit"
              />
            </div>
          </ChatInput>
        </div>
      </div>
    </div>
  );
}
