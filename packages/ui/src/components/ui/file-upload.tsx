"use client";

import { FileText, Upload, X } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { Button } from "./button";
import { Card } from "./card";

export interface IFileUpload {
  mimeType: string;
  size: number;
  name: string;
  url: string;
}

function FileItem({
  file,
  onRemove,
}: {
  file: IFileUpload;
  onRemove: () => void;
}) {
  const isImage = file.mimeType.startsWith("image/");

  return (
    <div className="group flex items-center gap-3 py-4">
      <div className="relative size-10 shrink-0 overflow-hidden rounded border bg-muted">
        {isImage ? (
          <img
            alt={file.name}
            className="h-full w-full object-cover"
            src={file.url}
          />
        ) : (
          <FileText className="size-4" />
        )}
      </div>
      <div className="flex w-full flex-col gap-1">
        <div className="flex justify-between gap-2">
          <span className="w-full max-w-xs flex-1 select-none truncate text-xs/6 group-disabled:opacity-50 sm:text-sm/6">
            {file.name}
          </span>

          <Button
            aria-label="Cancel"
            onClick={onRemove}
            size="icon-xs"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export interface FileUploadProps
  extends React.ComponentPropsWithRef<"input">,
    React.InputHTMLAttributes<HTMLInputElement> {
  files: IFileUpload[];
  setFiles: (files: IFileUpload[]) => void;
  onDropFiles?: (event: React.DragEvent) => void;
  supportedTypes?: string[];
  maxSizeMB?: number;
}

export function IFileUpload({
  files,
  setFiles,
  onDropFiles: onDropFilesProp,
  supportedTypes,
  maxSizeMB,
  ...props
}: FileUploadProps) {
  const filePickerRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const openFilePicker = () => {
    filePickerRef.current?.click();
  };

  const onDropFiles = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    onDropFilesProp?.(event);
  };

  const removeUploadById = (index: number) => {
    setFiles(
      files.filter((file, i) => {
        if (i === index && file.url) {
          URL.revokeObjectURL(file.url);
        }
        return i !== index;
      }),
    );
  };

  return (
    <>
      <Card
        className="group flex max-h-[200px] w-full cursor-pointer flex-col items-center justify-center gap-4 border-dashed py-8 text-sm transition-colors hover:bg-muted/40"
        onClick={openFilePicker}
        onDragLeave={() => {
          setIsDragOver(false);
          setTimeout(() => setIsDragOver(false), 300);
        }}
        onDragOver={() => {
          setIsDragOver(true);
          setTimeout(() => setIsDragOver(true), 300);
        }}
        onDrop={onDropFiles}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Upload className="size-5" />
            {isDragOver
              ? "Drop here to upload selected files"
              : "Drop files here or click to browse files"}
          </div>
          <span className="text-muted-foreground text-xs group-disabled:opacity-50">
            Supported:{" "}
            {supportedTypes ? supportedTypes.join(", ") : "All types"}
            {maxSizeMB ? ` (max ${maxSizeMB}MB)` : ""}
          </span>
        </div>

        <input
          className="hidden"
          {...props}
          ref={(el) => {
            filePickerRef.current = el;
            if (typeof props.ref === "function") {
              props.ref(el);
            } else if (props.ref) {
              props.ref.current = el;
            }
          }}
          type="file"
        />
      </Card>

      {files.length > 0 && (
        <div className="flex max-h-[200px] flex-col gap-4 divide-y overflow-y-auto">
          {files.map((file, index) => (
            <FileItem
              file={file}
              key={`${file.name}-${file.size}-${index}`}
              onRemove={() => removeUploadById(index)}
            />
          ))}
        </div>
      )}
    </>
  );
}
