import {
  ShortcutDisplay,
  type ShortcutKeys,
} from "@rectangular-labs/ui/components/ui/shortcut";
import {
  Toggle,
  type ToggleProps,
} from "@rectangular-labs/ui/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@rectangular-labs/ui/components/ui/tooltip";
import * as React from "react";
import { useTiptapEditor } from "../../hooks/use-tiptap-editor";
import { isNodeInSchema } from "../../tiptap-utils";
import { BlockQuoteIcon, CodeBlockIcon } from "../icons";

type NodeType = "codeBlock" | "blockquote";

const nodeOptions: Record<
  NodeType,
  {
    icon: React.ElementType;
    shortcutKey: ShortcutKeys;
    label: string;
  }
> = {
  codeBlock: {
    icon: CodeBlockIcon,
    shortcutKey: "ctrl-alt-c",
    label: "Code Block",
  },
  blockquote: {
    icon: BlockQuoteIcon,
    shortcutKey: "ctrl-shift-b",
    label: "Blockquote",
  },
};

function useNode(type: NodeType, manuallyDisabled = false) {
  const editor = useTiptapEditor();

  const isDisabled = React.useMemo(() => {
    const nodeInSchema = isNodeInSchema(type, editor);

    if (!nodeInSchema) {
      console.warn(
        `Node type ${type} is not available. Make sure it is included in your editor configuration.`,
      );
    }
    if (!editor || manuallyDisabled || !nodeInSchema) return true;

    try {
      return type === "codeBlock"
        ? !editor.can().toggleNode("codeBlock", "paragraph")
        : !editor.can().toggleWrap("blockquote");
    } catch {
      return true;
    }
  }, [editor, type, manuallyDisabled]);

  const isActive = React.useMemo(() => {
    if (!editor) return false;
    return editor.isActive(type);
  }, [editor, type]);

  const handleToggle = React.useCallback(() => {
    if (!editor || isDisabled) return false;

    if (type === "codeBlock") {
      return editor.chain().focus().toggleNode("codeBlock", "paragraph").run();
    }
    return editor.chain().focus().toggleWrap("blockquote").run();
  }, [editor, type, isDisabled]);

  const displayOptions = nodeOptions[type];

  return {
    isDisabled,
    isActive,
    handleToggle,
    displayOptions,
  };
}

interface NodeButtonProps
  extends Omit<ToggleProps, "type" | "pressed" | "onPressedChange"> {
  /**
   * The type of node to toggle.
   */
  type: NodeType;
  showText?: boolean;
}
export const NodeButton = React.forwardRef<HTMLButtonElement, NodeButtonProps>(
  ({ type, disabled, showText, ...buttonProps }, ref) => {
    const { isDisabled, isActive, handleToggle, displayOptions } = useNode(
      type,
      disabled,
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            ref={ref}
            size="sm"
            tabIndex={-1}
            {...buttonProps}
            aria-label={displayOptions.label}
            disabled={isDisabled}
            pressed={isActive}
            onClick={handleToggle}
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
  },
);

NodeButton.displayName = "NodeButton";

export default NodeButton;
