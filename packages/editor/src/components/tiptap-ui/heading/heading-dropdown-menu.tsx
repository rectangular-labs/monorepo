import {
  Button,
  type ButtonProps,
} from "@rectangular-labs/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rectangular-labs/ui/components/ui/dropdown-menu";
import * as React from "react";
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor";
import { ChevronDownIcon, HeadingIcon } from "../../icons";
import HeadingButton, { HeadingOptions, type Level } from "./heading-button";

interface HeadingDropdownMenuProps extends Omit<ButtonProps, "type"> {
  /**
   * The levels to display in the dropdown.
   * @default [1, 2, 3, 4, 5, 6]
   */
  levels?: Level[];
}

export function HeadingDropdownMenu({
  levels = [1, 2, 3, 4, 5, 6],
  ...props
}: HeadingDropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const editor = useTiptapEditor();

  const currentDisplayOption = React.useMemo(() => {
    for (const level of levels) {
      if (editor?.isActive("heading", { level })) {
        return { ...HeadingOptions[level], isActive: true };
      }
    }
    return {
      icon: HeadingIcon,
      label: "Heading",
      isActive: false,
    };
  }, [editor, levels]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={"ghost"}
          tabIndex={-1}
          aria-label="Format text as heading"
          data-active-state={currentDisplayOption.isActive ? "on" : "off"}
          {...props}
        >
          <currentDisplayOption.icon />
          <span>{currentDisplayOption.label}</span>
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuGroup>
          {levels.map((level) => (
            <DropdownMenuItem key={`heading-${level}`} asChild>
              <HeadingButton level={level} showText />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
