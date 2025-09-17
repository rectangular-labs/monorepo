"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@repo/shadcn-ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/shadcn-ui/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/shadcn-ui/components/ui/avatar";

export interface UserMenuProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  onItemClick?: (item: string) => void;
}

export const UserMenu = React.forwardRef<HTMLButtonElement, UserMenuProps>(
  (
    {
      userName = "John Doe",
      userEmail = "john@example.com",
      userAvatar,
      onItemClick,
    },
    ref,
  ) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={ref}
            variant="ghost"
            className="h-8 px-2 py-0 hover:bg-accent hover:text-accent-foreground"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="text-xs">
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <ChevronDownIcon className="ml-1 h-3 w-3" />
            <span className="sr-only">User menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="font-medium text-sm leading-none">{userName}</p>
              <p className="text-muted-foreground text-xs leading-none">
                {userEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onItemClick?.("profile")}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onItemClick?.("settings")}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onItemClick?.("billing")}>
            Billing
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onItemClick?.("logout")}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

UserMenu.displayName = "UserMenu";

export default UserMenu;
