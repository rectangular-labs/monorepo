import type { ButtonProps } from "@rectangular-labs/ui/components/ui/button";
import type { ShortcutKeys } from "@rectangular-labs/ui/components/ui/shortcut";

import * as React from "react";
import { useMemo } from "react";
import { useTiptapEditor } from "../../hooks/use-tiptap-editor";
import {
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  StrikeIcon,
  SubscriptIcon,
  SuperscriptIcon,
  UnderlineIcon,
} from "../icons";
import { BaseActionButton } from "./base-action-button";

type Mark =
  | "bold"
  | "italic"
  | "strike"
  | "code"
  | "underline"
  | "superscript"
  | "subscript";

const markOptions: Record<
  Mark,
  {
    icon: React.ElementType;
    shortcutKey: ShortcutKeys;
    label: string;
  }
> = {
  bold: {
    icon: BoldIcon,
    shortcutKey: "ctrl-b",
    label: "Bold",
  },
  italic: {
    icon: ItalicIcon,
    shortcutKey: "ctrl-i",
    label: "Italic",
  },
  underline: {
    icon: UnderlineIcon,
    shortcutKey: "ctrl-u",
    label: "Underline",
  },
  strike: {
    icon: StrikeIcon,
    shortcutKey: "ctrl-shift-s",
    label: "Strike",
  },
  code: {
    icon: Code2Icon,
    shortcutKey: "ctrl-e",
    label: "Code",
  },
  superscript: {
    icon: SuperscriptIcon,
    shortcutKey: "ctrl-.",
    label: "Superscript",
  },
  subscript: {
    icon: SubscriptIcon,
    shortcutKey: "ctrl-,",
    label: "Subscript",
  },
};

export function useMark(type: Mark, manuallyDisabled = false) {
  const editor = useTiptapEditor();

  const isDisabled = useMemo(() => {
    const markInSchema = editor?.schema.spec.marks.get(type) !== undefined;

    if (!markInSchema) {
      console.warn(
        `Mark type ${type} is not available. Make sure it is included in your editor configuration.`,
      );
    }
    if (
      !editor ||
      manuallyDisabled ||
      !markInSchema ||
      editor.isActive("codeBlock")
    )
      return true;

    try {
      return !editor.can().toggleMark(type);
    } catch (error) {
      console.error("Error checking mark toggle", error);
      return true;
    }
  }, [editor, type, manuallyDisabled]);

  const isActive = useMemo(() => {
    if (!editor) return false;
    return editor.isActive(type);
  }, [editor, type]);

  const handleToggleMark = React.useCallback(() => {
    if (isDisabled || !editor) return false;
    return editor.chain().focus().toggleMark(type).run();
  }, [editor, type, isDisabled]);

  const displayOptions = markOptions[type];

  return {
    isDisabled,
    isActive,
    handleToggleMark,
    displayOptions,
  };
}

interface MarkButtonProps extends Omit<ButtonProps, "type"> {
  /**
   * The type of mark to toggle
   */
  type: Mark;
  showText?: boolean;
}

export const MarkButton = React.forwardRef<HTMLButtonElement, MarkButtonProps>(
  ({ type, showText, disabled, ...buttonProps }, ref) => {
    const { isDisabled, isActive, handleToggleMark, displayOptions } = useMark(
      type,
      disabled,
    );

    return (
      <BaseActionButton
        ref={ref}
        disabled={isDisabled}
        aria-pressed={isActive}
        tooltip={{
          content: displayOptions.label,
          shortcutKeys: [displayOptions.shortcutKey],
        }}
        defaultClickAction={handleToggleMark}
        icon={<displayOptions.icon />}
        text={displayOptions.label}
        showText={showText}
        {...buttonProps}
      />
    );
  },
);

MarkButton.displayName = "MarkButton";

export default MarkButton;
