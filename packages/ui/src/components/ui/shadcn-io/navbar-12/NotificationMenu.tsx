"use client";

import * as React from "react";
import { BellIcon } from "lucide-react";
import { Button } from "@repo/shadcn-ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/shadcn-ui/components/ui/dropdown-menu";
import { Badge } from "@repo/shadcn-ui/components/ui/badge";

export interface NotificationMenuProps {
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    unread?: boolean;
  }>;
  onNotificationClick?: (notificationId: string) => void;
}

const defaultNotifications = [
  {
    id: "1",
    title: "New message",
    message: "You have a new message from John",
    time: "2 min ago",
    unread: true,
  },
  {
    id: "2",
    title: "Project updated",
    message: "The project was successfully updated",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: "3",
    title: "Task completed",
    message: "Your task has been marked as complete",
    time: "3 hours ago",
    unread: false,
  },
];

export const NotificationMenu = React.forwardRef<
  HTMLButtonElement,
  NotificationMenuProps
>(({ notifications = defaultNotifications, onNotificationClick }, ref) => {
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={ref}
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
        >
          <BellIcon className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="-top-1 -right-1 absolute flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            className="flex cursor-pointer flex-col items-start p-3"
            onClick={() => {
              if (onNotificationClick) {
                onNotificationClick(notification.id);
              }
            }}
          >
            <div className="flex w-full items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm leading-none">
                    {notification.title}
                  </p>
                  {notification.unread && (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                  {notification.message}
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  {notification.time}
                </p>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-center">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

NotificationMenu.displayName = "NotificationMenu";

export default NotificationMenu;
