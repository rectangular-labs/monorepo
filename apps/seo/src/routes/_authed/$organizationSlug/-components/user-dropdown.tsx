"use client";

import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { getInitials } from "@rectangular-labs/core/format/initials";
import * as Icons from "@rectangular-labs/ui/components/icon";
import {
  ThemeToggle,
  useTheme,
} from "@rectangular-labs/ui/components/theme-provider";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@rectangular-labs/ui/components/ui/avatar";
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerLabel,
  DropDrawerSeparator,
  DropDrawerTrigger,
} from "@rectangular-labs/ui/components/ui/dropdrawer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";

type User = NonNullable<RouterOutputs["auth"]["session"]["current"]>["user"];
export type UserDropdownProps = {
  user?: User | undefined;
};

export function UserDropdown({ user }: UserDropdownProps) {
  const userInitials = getInitials(user?.name ?? user?.email ?? "")
    .toUpperCase()
    .slice(0, 2);
  const { setTheme } = useTheme();
  const toggleTheme = () => {
    setTheme((theme) => (theme === "dark" ? "light" : "dark"));
  };

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: signOut, isPending: isSigningOut } = useMutation(
    getApiClientRq().auth.session.signOut.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getApiClientRq().auth.session.current.queryKey(),
        });
        await navigate({ to: "/login" });
      },
    }),
  );

  if (!user) {
    return null;
  }

  return (
    <DropDrawer>
      <DropDrawerTrigger className="rounded-full bg-background">
        <Avatar className="size-6">
          <AvatarImage src={user?.image ?? undefined} />
          <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
        </Avatar>
        <span className="sr-only">Open user menu</span>
      </DropDrawerTrigger>
      <DropDrawerContent align="end">
        <DropDrawerLabel>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.image ?? undefined} />
              <AvatarFallback className="text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{user?.name}</span>
              <span className="text-muted-foreground text-xs">
                {user?.email}
              </span>
            </div>
          </div>
        </DropDrawerLabel>
        <DropDrawerSeparator />

        {/* <DropDrawerItem asChild>
          <Link
            className="flex w-full items-center gap-2"
            params={{ organizationSlug }}
            to="/$organizationSlug/settings"
          >
            <Icons.Settings />
            Settings
          </Link>
        </DropDrawerItem> */}
        <DropDrawerItem
          onClick={(e) => {
            e.preventDefault();
            toggleTheme();
          }}
        >
          <ThemeToggle className="size-4" variant={"ghost"} />
          <span>Toggle theme</span>
        </DropDrawerItem>
        <DropDrawerSeparator />
        <DropDrawerItem
          disabled={isSigningOut}
          onClick={(e) => {
            e.preventDefault();
            signOut(undefined);
          }}
        >
          <Icons.LogOut className="size-4" />
          Logout
        </DropDrawerItem>
      </DropDrawerContent>
    </DropDrawer>
  );
}
