"use client";
import {
  ShortcutDisplay,
  type ShortcutKeys,
} from "@rectangular-labs/ui/components/ui/shortcut";
import {
  Toggle,
  type ToggleProps,
} from "@rectangular-labs/ui/components/ui/toggle";
import {
  TooltipContent,
  TooltipTrigger,
} from "@rectangular-labs/ui/components/ui/tooltip";
import { Tooltip } from "@rectangular-labs/ui/components/ui/tooltip";
import * as React from "react";
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor";
import { isNodeInSchema } from "../../../tiptap-utils";
import { ListIcon, ListOrderedIcon, ListTodoIcon } from "../../icons";

export type ListType = "bulletList" | "orderedList" | "taskList";

export const ListOptions: Record<
  ListType,
  {
    shortcutKey: ShortcutKeys;
    label: string;
    icon: React.ElementType;
  }
> = {
  bulletList: {
    shortcutKey: "ctrl-shift-7",
    label: "Bullet List",
    icon: ListIcon,
  },
  orderedList: {
    shortcutKey: "ctrl-shift-8",
    label: "Ordered List",
    icon: ListOrderedIcon,
  },
  taskList: {
    shortcutKey: "ctrl-shift-9",
    label: "Task List",
    icon: ListTodoIcon,
  },
};

function useListState(type: ListType, manuallyDisabled = false) {
  const editor = useTiptapEditor();

  const isDisabled = React.useMemo(() => {
    const listInSchema = isNodeInSchema(type, editor);

    if (!listInSchema) {
      console.warn(
        `List type ${type} is not available. Make sure it is included in your editor configuration.`,
      );
    }
    if (
      !editor ||
      !listInSchema ||
      manuallyDisabled ||
      editor.isActive("codeBlock")
    )
      return true;

    try {
      switch (type) {
        case "bulletList":
          return !editor.can().toggleBulletList();
        case "orderedList":
          return !editor.can().toggleOrderedList();
        case "taskList":
          return !editor.can().toggleList("taskList", "taskItem");
        default:
          return true;
      }
    } catch (error) {
      console.error("Error checking mark toggle", error);
      return true;
    }
  }, [editor, type, manuallyDisabled]);

  const isActive = React.useMemo(() => {
    if (!editor) return false;
    return editor.isActive(type);
  }, [editor, type]);

  const toggleList = React.useCallback(() => {
    if (!editor) return;
    switch (type) {
      case "bulletList":
        editor.chain().focus().toggleBulletList().run();
        break;
      case "orderedList":
        editor.chain().focus().toggleOrderedList().run();
        break;
      case "taskList":
        editor.chain().focus().toggleList("taskList", "taskItem").run();
        break;
    }
  }, [editor, type]);

  const displayOptions = ListOptions[type];

  return {
    isDisabled,
    isActive,
    toggleList,
    displayOptions,
  };
}

interface ListToggleProps
  extends Omit<ToggleProps, "type" | "pressed" | "onPressedChange"> {
  /**
   * The type of list to toggle.
   */
  type: ListType;
  showText?: boolean;
}
export const ListToggle = React.forwardRef<HTMLButtonElement, ListToggleProps>(
  ({ type, showText, ...buttonProps }, ref) => {
    const { toggleList, isActive, displayOptions } = useListState(
      type,
      buttonProps.disabled,
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            ref={ref}
            tabIndex={-1}
            {...buttonProps}
            aria-label={displayOptions.label}
            onPressedChange={toggleList}
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
  },
);

ListToggle.displayName = "ListButton";

export default ListToggle;
