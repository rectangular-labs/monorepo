"use client";

import { Crepe } from "@milkdown/crepe";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";

function MarkdownEditorInner({
  markdown,
  readOnly,
  onMarkdownChange,
  onUploadImage,
}: {
  markdown: string;
  readOnly: boolean;
  onMarkdownChange?: (markdown: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: markdown,
      ...(onUploadImage
        ? {
            featureConfigs: {
              [Crepe.Feature.ImageBlock]: {
                onUpload: onUploadImage,
              },
            },
          }
        : {}),
    });

    crepe.setReadonly(readOnly);

    if (onMarkdownChange) {
      crepe.on((api) => {
        api.markdownUpdated((_ctx, nextMarkdown, prevMarkdown) => {
          if (nextMarkdown !== prevMarkdown) {
            onMarkdownChange(nextMarkdown);
          }
        });
      });
    }

    return crepe;
  });

  return <Milkdown />;
}

export function MarkdownEditor({
  markdown,
  readOnly = false,
  onMarkdownChange,
  onUploadImage,
}: {
  markdown: string;
  readOnly?: boolean;
  onMarkdownChange?: (markdown: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  return (
      <MilkdownProvider>
        <MarkdownEditorInner
          markdown={markdown}
          onMarkdownChange={onMarkdownChange}
          onUploadImage={onUploadImage}
          readOnly={readOnly}
        />
      </MilkdownProvider>
  );
}

