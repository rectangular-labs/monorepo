import * as React from "react";

import type { ButtonProps } from "@rectangular-labs/ui/components/ui/button";
import type { ShortcutKeys } from "@rectangular-labs/ui/components/ui/shortcut";

import type { Editor } from "@tiptap/react";
import { useTiptapEditor } from "../../hooks/use-tiptap-editor";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
} from "../icons";
import { BaseActionButton } from "./base-action-button";

type TextAlign = "left" | "center" | "right" | "justify";

const textAlignOptions: Record<
  TextAlign,
  {
    icon: React.ElementType;
    shortcutKey: ShortcutKeys;
    label: string;
  }
> = {
  left: {
    icon: AlignLeftIcon,
    shortcutKey: "ctrl-shift-l",
    label: "Left",
  },
  center: {
    icon: AlignCenterIcon,
    shortcutKey: "ctrl-shift-c",
    label: "Center",
  },
  right: {
    icon: AlignRightIcon,
    shortcutKey: "ctrl-shift-r",
    label: "Right",
  },
  justify: {
    icon: AlignJustifyIcon,
    shortcutKey: "ctrl-shift-j",
    label: "Justify",
  },
};

function isTextAlignExtensionAvailable(editor: Editor | null) {
  return editor?.extensionManager.extensions.some(
    (extension) => extension.name === "textAlign",
  );
}

export function useTextAlign(align: TextAlign, manuallyDisabled = false) {
  const editor = useTiptapEditor();

  const isDisabled = React.useMemo(() => {
    const hasExtension = isTextAlignExtensionAvailable(editor);

    if (!hasExtension) {
      console.warn(
        `TextAlign extension for ${align} is not available. Make sure it is included in your editor configuration.`,
      );
    }
    if (!editor || !hasExtension || manuallyDisabled) return true;

    try {
      return !editor?.can().setTextAlign(align);
    } catch (error) {
      console.error("Error checking if text align is disabled", error);
      return true;
    }
  }, [editor, manuallyDisabled, align]);

  const isActive = React.useMemo(() => {
    if (!editor) return false;
    return editor.isActive({ textAlign: align });
  }, [editor, align]);

  const handleAlignment = React.useCallback(() => {
    if (!editor || isDisabled) return false;
    const chain = editor.chain().focus();
    return chain.setTextAlign(align).run();
  }, [editor, isDisabled, align]);

  const displayOptions = textAlignOptions[align];

  return {
    isDisabled,
    isActive,
    handleAlignment,
    displayOptions,
  };
}

interface TextAlignButtonProps extends ButtonProps {
  /**
   * The text alignment to apply.
   */
  align: TextAlign;
  showText?: boolean;
}
export const TextAlignButton = React.forwardRef<
  HTMLButtonElement,
  TextAlignButtonProps
>(
  (
    { align, showText, className = "", disabled, onClick, ...buttonProps },
    ref,
  ) => {
    const { isDisabled, isActive, handleAlignment, displayOptions } =
      useTextAlign(align, disabled);

    return (
      <BaseActionButton
        ref={ref}
        disabled={isDisabled}
        aria-pressed={isActive}
        tooltip={{
          content: displayOptions.label,
          shortcutKeys: [displayOptions.shortcutKey],
        }}
        defaultClickAction={handleAlignment}
        icon={<displayOptions.icon />}
        text={displayOptions.label}
        showText={showText}
        {...buttonProps}
      />
    );
  },
);

TextAlignButton.displayName = "TextAlignButton";

export default TextAlignButton;
