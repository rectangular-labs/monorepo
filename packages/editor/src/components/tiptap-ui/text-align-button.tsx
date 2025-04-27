import type { ShortcutKeys } from "@rectangular-labs/ui/components/ui/shortcut";
import * as React from "react";

import {
  Toggle,
  type ToggleProps,
} from "@rectangular-labs/ui/components/ui/toggle";
import type { Editor } from "@tiptap/react";
import { useTiptapEditor } from "../../hooks/use-tiptap-editor";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
} from "../icons";

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

function isTextAlignDisabled(
  editor: Editor | null,
  align: TextAlign,
  manuallyDisabled = false,
) {
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
}

function isTextAlignActive(editor: Editor | null, align: TextAlign) {
  return editor?.isActive({ textAlign: align }) ?? false;
}

export function useTextAlign(align: TextAlign, manuallyDisabled = false) {
  const editor = useTiptapEditor();

  const isDisabled = isTextAlignDisabled(editor, align, manuallyDisabled);

  const isActive = isTextAlignActive(editor, align);

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

interface TextAlignButtonProps
  extends Omit<ToggleProps, "pressed" | "onPressedChange"> {
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
        pressed={isActive}
        onClick={handleAlignment}
      >
        <displayOptions.icon />
        {showText && <span>{displayOptions.label}</span>}
      </Toggle>
    );
  },
);

TextAlignButton.displayName = "TextAlignButton";

export default TextAlignButton;
