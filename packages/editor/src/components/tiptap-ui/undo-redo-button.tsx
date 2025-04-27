import type { ButtonProps } from "@rectangular-labs/ui/components/ui/button";
import type { ShortcutKeys } from "@rectangular-labs/ui/components/ui/shortcut";
import * as React from "react";
import { useTiptapEditor } from "../../hooks/use-tiptap-editor";
import { RedoIcon, UndoIcon } from "../icons";
import { BaseActionButton } from "./base-action-button";

type HistoryAction = "undo" | "redo";

const historyIcons = {
  undo: UndoIcon,
  redo: RedoIcon,
};
const historyShortcutKeys: Record<HistoryAction, ShortcutKeys> = {
  undo: "ctrl-z",
  redo: "ctrl-shift-z",
};
const historyActionLabels = {
  undo: "Undo",
  redo: "Redo",
};

/**
 * Hook that provides all the necessary state and handlers for a history action.
 *
 * @param editor The TipTap editor instance
 * @param action The history action to handle
 * @returns Object containing state and handlers for the history action
 */
function useHistoryAction(action: HistoryAction, manuallyDisabled = false) {
  const editor = useTiptapEditor();
  const isDisabled = React.useMemo(() => {
    if (!editor || manuallyDisabled) return true;
    if (action === "undo") {
      return !editor.can().undo();
    }
    return !editor.can().redo();
  }, [editor, action, manuallyDisabled]);

  const handleAction = React.useCallback(() => {
    if (!editor || !isDisabled) return;
    const chain = editor.chain().focus();

    if (action === "undo") {
      chain.undo().run();
    } else {
      chain.redo().run();
    }
  }, [editor, action, isDisabled]);

  const Icon = historyIcons[action];
  const actionLabel = historyActionLabels[action];
  const shortcutKey = historyShortcutKeys[action];

  return {
    isDisabled,
    handleAction,
    Icon,
    actionLabel,
    shortcutKey,
  };
}

interface UndoRedoButtonProps extends ButtonProps {
  action: HistoryAction;
  showText?: boolean;
}

/**
 * Button component for triggering undo/redo actions in a TipTap editor.
 */
export const UndoRedoButton = React.forwardRef<
  HTMLButtonElement,
  UndoRedoButtonProps
>(({ action, showText, onClick, ...props }, ref) => {
  const { isDisabled, handleAction, Icon, actionLabel, shortcutKey } =
    useHistoryAction(action, props.disabled);

  return (
    <BaseActionButton
      ref={ref}
      disabled={isDisabled}
      tooltip={{
        content: actionLabel,
        shortcutKeys: [shortcutKey],
      }}
      defaultClickAction={handleAction}
      icon={<Icon />}
      text={actionLabel}
      showText={showText}
      {...props}
    />
  );
});

UndoRedoButton.displayName = "UndoRedoButton";
