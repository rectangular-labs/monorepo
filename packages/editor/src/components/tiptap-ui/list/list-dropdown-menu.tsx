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
import { ChevronDownIcon, ListIcon } from "../../icons";
import ListToggle, { ListOptions, type ListType } from "./list-button";

interface ListDropdownMenuProps extends Omit<ButtonProps, "type"> {
  /**
   * The list types to display in the dropdown.
   */
  types?: ListType[];
}

export function ListDropdownMenu({
  types = ["bulletList", "orderedList", "taskList"],
  ...props
}: ListDropdownMenuProps) {
  const editor = useTiptapEditor();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentDisplayOption = React.useMemo(() => {
    for (const listType of types) {
      if (editor?.isActive(listType)) {
        return { ...ListOptions[listType], isActive: true };
      }
    }
    return {
      icon: ListIcon,
      label: "List",
      isActive: false,
    };
  }, [editor, types]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          tabIndex={-1}
          aria-label="List options"
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
          {types.map((listType) => (
            <DropdownMenuItem key={listType} asChild>
              <ListToggle
                type={listType}
                showText
                className="w-full justify-start"
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
