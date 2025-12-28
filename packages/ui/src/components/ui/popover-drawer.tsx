import { useControllableState } from "radix-ui";
import { useIsMobile } from "@rectangular-labs/ui/hooks/use-mobile";
import { cn } from "@rectangular-labs/ui/utils/cn";
import type React from "react";
import { Drawer, DrawerContent, DrawerTrigger } from "./drawer";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export default function PopoverDrawer({
  children,
  trigger,
  className,
  open: controlledOpen = false,
  onOpenChange: controlledOnOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  trigger?: React.ReactNode;
}) {
  const [open, onOpenChange] = useControllableState({
    defaultProp: controlledOpen,
    ...(typeof controlledOpen === "boolean" ? { prop: controlledOpen } : {}),
    ...(controlledOnOpenChange ? { onChange: controlledOnOpenChange } : {}),
  });
  const isMobile = useIsMobile();

  return isMobile ? (
    <Drawer onOpenChange={onOpenChange} open={open}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent className={className}>{children}</DrawerContent>
    </Drawer>
  ) : (
    <Popover onOpenChange={onOpenChange} open={open}>
      {trigger && <PopoverTrigger asChild>{trigger}</PopoverTrigger>}
      <PopoverContent
        align="start"
        className={cn("w-(--radix-popover-trigger-width) p-0", className)}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
