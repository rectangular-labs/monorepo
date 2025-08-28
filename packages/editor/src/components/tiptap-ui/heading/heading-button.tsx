import {
  ShortcutDisplay,
  type ShortcutKeys,
} from "@rectangular-labs/ui/components/ui/shortcut";
import * as React from "react";
import {
  HeadingFiveIcon,
  HeadingFourIcon,
  HeadingOneIcon,
  HeadingSixIcon,
  HeadingThreeIcon,
  HeadingTwoIcon,
} from "../../icons"; // Adjusted path

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"; // Adjusted path

import {
  Toggle,
  type ToggleProps,
} from "@rectangular-labs/ui/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@rectangular-labs/ui/components/ui/tooltip";
// --- Lib ---
import { isNodeInSchema } from "../../../tiptap-utils"; // Corrected path

export type Level = 1 | 2 | 3 | 4 | 5 | 6;

// --- Constants ---
export const HeadingOptions: Record<
  Level,
  {
    icon: React.ElementType;
    shortcutKey: ShortcutKeys;
    label: string;
  }
> = {
  1: {
    icon: HeadingOneIcon,
    shortcutKey: "ctrl-alt-1",
    label: "Heading 1",
  },
  2: {
    icon: HeadingTwoIcon,
    shortcutKey: "ctrl-alt-2",
    label: "Heading 2",
  },
  3: {
    icon: HeadingThreeIcon,
    shortcutKey: "ctrl-alt-3",
    label: "Heading 3",
  },
  4: {
    icon: HeadingFourIcon,
    shortcutKey: "ctrl-alt-4",
    label: "Heading 4",
  },
  5: {
    icon: HeadingFiveIcon,
    shortcutKey: "ctrl-alt-5",
    label: "Heading 5",
  },
  6: {
    icon: HeadingSixIcon,
    shortcutKey: "ctrl-alt-6",
    label: "Heading 6",
  },
};

export function useHeading(level: Level, manuallyDisabled = false) {
  const editor = useTiptapEditor();

  const isDisabled = React.useMemo(() => {
    const isHeadingInSchema = isNodeInSchema("heading", editor);
    if (!isHeadingInSchema) {
      console.warn(
        `Heading ${level} node is not available in the editor schema. Make sure it is included in your editor configuration.`,
      );
    }
    if (
      !editor ||
      !isHeadingInSchema ||
      manuallyDisabled ||
      editor.isActive("codeBlock")
    ) {
      return true;
    }

    try {
      return !editor.can().toggleNode("heading", "paragraph", { level });
    } catch (e) {
      console.error("Error checking heading toggle", e);
      return true;
    }
  }, [editor, level, manuallyDisabled]);

  const isActive = React.useMemo(() => {
    if (!editor) return false;
    return editor.isActive("heading", { level });
  }, [editor, level]);

  const handleToggle = React.useCallback(() => {
    if (!editor || isDisabled) return;
    if (editor.isActive("heading", { level })) {
      return editor.chain().focus().setNode("paragraph").run();
    }
    return editor
      .chain()
      .focus()
      .toggleNode("heading", "paragraph", { level })
      .run();
  }, [editor, level, isDisabled]);

  const displayOptions = HeadingOptions[level];

  return {
    isDisabled,
    isActive,
    handleToggle,
    displayOptions,
  };
}

// --- Component Props ---
export interface HeadingButtonProps
  extends Omit<ToggleProps, "type" | "pressed" | "onPressedChange"> {
  /**
   * The heading level.
   */
  level: Level;
  /**
   * Whether to display the text label next to the icon.
   * @default false
   */
  showText?: boolean;
}

export const HeadingButton = React.forwardRef<
  HTMLButtonElement,
  HeadingButtonProps
>(({ level, showText = false, disabled, ...buttonProps }, ref) => {
  const { isDisabled, isActive, handleToggle, displayOptions } = useHeading(
    level,
    disabled,
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          ref={ref}
          tabIndex={-1}
          {...buttonProps}
          aria-label={displayOptions.label}
          disabled={isDisabled}
          onPressedChange={handleToggle}
          pressed={isActive}
        >
          <displayOptions.icon />
          {showText && <span>{displayOptions.label}</span>}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>
        <span>{displayOptions.label}</span>
        <ShortcutDisplay shortcutCombos={[displayOptions.shortcutKey]} />
      </TooltipContent>
    </Tooltip>
  );
});

HeadingButton.displayName = "HeadingButton";

export default HeadingButton;
