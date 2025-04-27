import {
  Button,
  type ButtonProps,
} from "@rectangular-labs/ui/components/ui/button";
import * as React from "react";
import { useTiptapEditor } from "../../hooks/use-tiptap-editor";

interface BaseActionButtonProps extends ButtonProps {
  /**
   * The default action to perform when the button is clicked,
   * if the event is not prevented by the onClick handler.
   */
  defaultClickAction?: () => void;
  /**
   * The icon to display on the button.
   */
  icon: React.ReactNode;
  /**
   * The text to display on the button.
   */
  text: string;
  /**
   * Whether to show the text on the button.
   */
  showText: boolean | undefined;
}

export const BaseActionButton = React.forwardRef<
  HTMLButtonElement,
  BaseActionButtonProps
>(
  (
    {
      defaultClickAction,
      onClick,
      children,
      icon,
      text,
      showText,
      ...buttonProps
    },
    ref,
  ) => {
    const editor = useTiptapEditor();
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);

        if (!e.defaultPrevented) {
          defaultClickAction?.();
        }
      },
      [onClick, defaultClickAction],
    );

    if (!editor || !editor.isEditable) {
      return null;
    }

    return (
      <Button
        type="button"
        tabIndex={-1}
        aria-label={text}
        onClick={handleClick}
        ref={ref}
        variant={"ghost"}
        size={showText ? "sm" : "icon"}
        {...buttonProps}
      >
        {children || (
          <>
            {icon}
            {showText && <span>{text}</span>}
          </>
        )}
      </Button>
    );
  },
);

BaseActionButton.displayName = "BaseActionButton";
