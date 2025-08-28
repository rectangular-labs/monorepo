import { type Editor, isNodeSelection } from "@tiptap/react";
import * as React from "react";
// --- Icons ---
import { BanIcon } from "@/components/tiptap-icons/ban-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
// --- UI Primitives ---
import {
  Button,
  type ButtonProps,
} from "@/components/tiptap-ui-primitive/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/tiptap-ui-primitive/popover";
import { Separator } from "@/components/tiptap-ui-primitive/separator";
// --- Hooks ---
import { useMenuNavigation } from "@/hooks/use-menu-navigation";
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";
// --- Lib ---
import { isMarkInSchema } from "@/lib/tiptap-utils";

// --- Styles ---
import "@/components/tiptap-ui/highlight-popover/highlight-popover.scss";

export interface HighlightColor {
  label: string;
  value: string;
  border?: string;
}

export interface HighlightContentProps {
  editor?: Editor | null;
  colors?: HighlightColor[];
  activeNode?: number;
}

export const DEFAULT_HIGHLIGHT_COLORS: HighlightColor[] = [
  {
    label: "Green",
    value: "var(--tt-highlight-green)",
    border: "var(--tt-highlight-green-contrast)",
  },
  {
    label: "Blue",
    value: "var(--tt-highlight-blue)",
    border: "var(--tt-highlight-blue-contrast)",
  },
  {
    label: "Red",
    value: "var(--tt-highlight-red)",
    border: "var(--tt-highlight-red-contrast)",
  },
  {
    label: "Purple",
    value: "var(--tt-highlight-purple)",
    border: "var(--tt-highlight-purple-contrast)",
  },
  {
    label: "Yellow",
    value: "var(--tt-highlight-yellow)",
    border: "var(--tt-highlight-yellow-contrast)",
  },
];

export const useHighlighter = (editor: Editor | null) => {
  const markAvailable = isMarkInSchema("highlight", editor);

  const getActiveColor = React.useCallback(() => {
    if (!editor) return null;
    if (!editor.isActive("highlight")) return null;
    const attrs = editor.getAttributes("highlight");
    return attrs.color || null;
  }, [editor]);

  const toggleHighlight = React.useCallback(
    (color: string) => {
      if (!markAvailable || !editor) return;
      if (color === "none") {
        editor.chain().focus().unsetMark("highlight").run();
      } else {
        editor.chain().focus().toggleMark("highlight", { color }).run();
      }
    },
    [markAvailable, editor],
  );

  return {
    markAvailable,
    getActiveColor,
    toggleHighlight,
  };
};

export const HighlighterButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, children, ...props }, ref) => {
  return (
    <Button
      aria-label="Highlight text"
      className={className}
      data-appearance="default"
      data-style="ghost"
      ref={ref}
      role="button"
      tabIndex={-1}
      tooltip="Highlight"
      type="button"
      {...props}
    >
      {children || <HighlighterIcon className="tiptap-button-icon" />}
    </Button>
  );
});

export function HighlightContent({
  editor: providedEditor,
  colors = DEFAULT_HIGHLIGHT_COLORS,
  onClose,
}: {
  editor?: Editor | null;
  colors?: HighlightColor[];
  onClose?: () => void;
}) {
  const editor = useTiptapEditor(providedEditor);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const { getActiveColor, toggleHighlight } = useHighlighter(editor);
  const activeColor = getActiveColor();

  const menuItems = React.useMemo(
    () => [...colors, { label: "Remove highlight", value: "none" }],
    [colors],
  );

  const { selectedIndex } = useMenuNavigation({
    containerRef,
    items: menuItems,
    orientation: "both",
    onSelect: (item) => {
      toggleHighlight(item.value);
      onClose?.();
    },
    onClose,
    autoSelectFirstItem: false,
  });

  return (
    <div className="tiptap-highlight-content" ref={containerRef}>
      <div className="tiptap-button-group" data-orientation="horizontal">
        {colors.map((color, index) => (
          <Button
            aria-label={`${color.label} highlight color`}
            data-active-state={activeColor === color.value ? "on" : "off"}
            data-highlighted={selectedIndex === index}
            data-style="ghost"
            key={color.value}
            onClick={() => toggleHighlight(color.value)}
            role="menuitem"
            tabIndex={index === selectedIndex ? 0 : -1}
            type="button"
          >
            <span
              className="tiptap-button-highlight"
              style={
                { "--highlight-color": color.value } as React.CSSProperties
              }
            />
          </Button>
        ))}
      </div>

      <Separator />

      <div className="tiptap-button-group">
        <Button
          aria-label="Remove highlight"
          data-highlighted={selectedIndex === colors.length}
          data-style="ghost"
          onClick={() => toggleHighlight("none")}
          role="menuitem"
          tabIndex={selectedIndex === colors.length ? 0 : -1}
          type="button"
        >
          <BanIcon className="tiptap-button-icon" />
        </Button>
      </div>
    </div>
  );
}

export interface HighlightPopoverProps extends Omit<ButtonProps, "type"> {
  /**
   * The TipTap editor instance.
   */
  editor?: Editor | null;
  /**
   * The highlight colors to display in the popover.
   */
  colors?: HighlightColor[];
  /**
   * Whether to hide the highlight popover.
   */
  hideWhenUnavailable?: boolean;
}

export function HighlightPopover({
  editor: providedEditor,
  colors = DEFAULT_HIGHLIGHT_COLORS,
  hideWhenUnavailable = false,
  ...props
}: HighlightPopoverProps) {
  const editor = useTiptapEditor(providedEditor);

  const { markAvailable } = useHighlighter(editor);
  const [isOpen, setIsOpen] = React.useState(false);

  const isDisabled = React.useMemo(() => {
    if (!markAvailable || !editor) {
      return true;
    }

    return (
      editor.isActive("code") ||
      editor.isActive("codeBlock") ||
      editor.isActive("imageUpload")
    );
  }, [markAvailable, editor]);

  const canSetMark = React.useMemo(() => {
    if (!editor || !markAvailable) return false;

    try {
      return editor.can().setMark("highlight");
    } catch {
      return false;
    }
  }, [editor, markAvailable]);

  const isActive = editor?.isActive("highlight") ?? false;

  const show = React.useMemo(() => {
    if (hideWhenUnavailable) {
      if (isNodeSelection(editor?.state.selection) || !canSetMark) {
        return false;
      }
    }

    return true;
  }, [hideWhenUnavailable, editor, canSetMark]);

  if (!show || !editor || !editor.isEditable) {
    return null;
  }

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <HighlighterButton
          aria-pressed={isActive}
          data-active-state={isActive ? "on" : "off"}
          data-disabled={isDisabled}
          disabled={isDisabled}
          {...props}
        />
      </PopoverTrigger>

      <PopoverContent aria-label="Highlight colors">
        <HighlightContent
          colors={colors}
          editor={editor}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

HighlighterButton.displayName = "HighlighterButton";

export default HighlightPopover;
