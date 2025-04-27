import type { ShortcutKeys } from "@rectangular-labs/ui/components/ui/shortcut";

import {
  Toggle,
  type ToggleProps,
} from "@rectangular-labs/ui/components/ui/toggle";
import * as React from "react";
import { useTiptapEditor } from "../../hooks/use-tiptap-editor";
import { isMarkInSchema } from "../../tiptap-utils";
import {
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  StrikeIcon,
  SubscriptIcon,
  SuperscriptIcon,
  UnderlineIcon,
} from "../icons";

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

  const isDisabled = (() => {
    const markInSchema = isMarkInSchema(type, editor);

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
  })();

  const isActive = (() => {
    if (!editor) return false;
    return editor.isActive(type);
  })();

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

interface MarkButtonProps
  extends Omit<ToggleProps, "type" | "pressed" | "onPressedChange"> {
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

    console.log("isActive", isActive, type);
    return (
      <Toggle
        ref={ref}
        size="sm"
        tabIndex={-1}
        tooltip={{
          content: displayOptions.label,
          shortcutKeys: [displayOptions.shortcutKey],
        }}
        {...buttonProps}
        aria-label={displayOptions.label}
        disabled={isDisabled}
        // pressed={true}
        onClick={handleToggleMark}
      >
        <displayOptions.icon />
        {showText && <span>{displayOptions.label}</span>}
      </Toggle>
    );
  },
);

MarkButton.displayName = "MarkButton";

export default MarkButton;
