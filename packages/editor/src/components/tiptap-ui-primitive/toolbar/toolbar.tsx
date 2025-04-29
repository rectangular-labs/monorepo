import { cn } from "@rectangular-labs/ui/utils/cn";
import * as React from "react";

type BaseProps = React.HTMLAttributes<HTMLDivElement>;

interface ToolbarProps extends BaseProps {
  variant?: "floating" | "fixed";
}

const mergeRefs = <T,>(
  refs: Array<React.RefObject<T> | React.Ref<T> | null | undefined>,
): React.RefCallback<T> => {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    }
  };
};

const useToolbarKeyboardNav = (
  toolbarRef: React.RefObject<HTMLDivElement | null>,
): void => {
  React.useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    const getFocusableElements = () =>
      Array.from(
        toolbar.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [role="button"]:not([disabled]), [tabindex="0"]:not([disabled])',
        ),
      );

    const navigateToIndex = (
      e: KeyboardEvent,
      targetIndex: number,
      elements: HTMLElement[],
    ) => {
      e.preventDefault();
      let nextIndex = targetIndex;

      if (nextIndex >= elements.length) {
        nextIndex = 0;
      } else if (nextIndex < 0) {
        nextIndex = elements.length - 1;
      }

      elements[nextIndex]?.focus();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusableElements = getFocusableElements();
      if (!focusableElements.length) return;

      const currentElement = document.activeElement as HTMLElement;
      const currentIndex = focusableElements.indexOf(currentElement);

      if (!toolbar.contains(currentElement)) return;

      const keyActions: Record<string, () => void> = {
        ArrowRight: () =>
          navigateToIndex(e, currentIndex + 1, focusableElements),
        ArrowDown: () =>
          navigateToIndex(e, currentIndex + 1, focusableElements),
        ArrowLeft: () =>
          navigateToIndex(e, currentIndex - 1, focusableElements),
        ArrowUp: () => navigateToIndex(e, currentIndex - 1, focusableElements),
        Home: () => navigateToIndex(e, 0, focusableElements),
        End: () =>
          navigateToIndex(e, focusableElements.length - 1, focusableElements),
      };

      const action = keyActions[e.key];
      if (action) {
        action();
      }
    };

    toolbar.addEventListener("keydown", handleKeyDown);
    return () => toolbar.removeEventListener("keydown", handleKeyDown);
  }, [toolbarRef]);
};

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ children, className, variant = "floating", ...props }, ref) => {
    const toolbarRef = React.useRef<HTMLDivElement>(null);

    useToolbarKeyboardNav(toolbarRef);

    return (
      <div
        ref={mergeRefs([toolbarRef, ref])}
        role="toolbar"
        aria-label="toolbar"
        style={{
          scrollbarWidth: "none",
        }}
        className={cn(
          "mx-auto flex h-11 w-full items-center gap-1 rounded-none border-t",
          "md:border-t-0 md:border-b",
          "[&::-webkit-scrollbar]:none",
          "overflow-x-auto overscroll-x-contain",
          "lg:max-w-4xl lg:rounded-md lg:border lg:shadow-md",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Toolbar.displayName = "Toolbar";
