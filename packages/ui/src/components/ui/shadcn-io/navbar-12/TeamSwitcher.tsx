"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@repo/shadcn-ui/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/shadcn-ui/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/shadcn-ui/components/ui/command";
import { CheckIcon } from "lucide-react";
import { cn } from "@repo/shadcn-ui/lib/utils";

export interface TeamSwitcherProps {
  teams: string[];
  defaultTeam?: string;
  onTeamChange?: (team: string) => void;
}

export const TeamSwitcher = React.forwardRef<
  HTMLButtonElement,
  TeamSwitcherProps
>(({ teams, defaultTeam, onTeamChange }, ref) => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(defaultTeam || teams[0] || "");

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === value ? "" : currentValue;
    setValue(newValue);
    setOpen(false);
    if (onTeamChange) {
      onTeamChange(newValue);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value || "Select team..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search team..." />
          <CommandList>
            <CommandEmpty>No team found.</CommandEmpty>
            <CommandGroup>
              {teams.map((team) => (
                <CommandItem
                  key={team}
                  value={team}
                  onSelect={() => handleSelect(team)}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === team ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {team}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

TeamSwitcher.displayName = "TeamSwitcher";

export default TeamSwitcher;
