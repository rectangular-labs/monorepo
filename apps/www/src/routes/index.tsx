import { ChatMessageArea } from "@rectangular-labs/ui/components/chat/chat-message-area";
import { FilePreview } from "@rectangular-labs/ui/components/chat/file-preview";
import { ThemeToggle } from "@rectangular-labs/ui/components/theme-provider";
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

  return (
    <div className="flex h-screen flex-col">
      <ThemeToggle className="absolute top-4 right-4 z-10" />
      <div className="flex-1 overflow-y-auto">
        <ChatMessageArea>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pt-5 pb-5"></div>
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
        </div>
      </div>
    </div>
  );
}
