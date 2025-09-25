"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { useIsMobile } from "@rectangular-labs/ui/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";

export type DrawerDialogProps = {
  loading?: boolean;
  open?: boolean;
  className?: string;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  trigger?: React.ReactNode;
};

export default function DialogDrawer({
  loading = false,
  open: controlledOpen,
  className,
  onOpenChange: controlledOnOpenChange,
  children,
  trigger,
}: DrawerDialogProps) {
  const [open, onOpenChange] = useControllableState({
    defaultProp: controlledOpen ?? false,
    ...(typeof controlledOpen === "boolean" ? { prop: controlledOpen } : {}),
    ...(controlledOnOpenChange ? { onChange: controlledOnOpenChange } : {}),
  });
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent
          className={className}
          onEscapeKeyDown={(e) => loading && e.preventDefault()}
          onInteractOutside={(e) => loading && e.preventDefault()}
        >
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent
        className={className}
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
        onInteractOutside={(e) => loading && e.preventDefault()}
      >
        {children}
      </DrawerContent>
    </Drawer>
  );
}

export function DialogDrawerHeader(props: React.ComponentProps<"div">) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <DrawerHeader {...props} />;
  }
  return <DialogHeader {...props} />;
}

export function DialogDrawerTitle(
  props: React.ComponentProps<typeof DialogTitle>,
) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <DrawerTitle {...props} />;
  }
  return <DialogTitle {...props} />;
}
export function DialogDrawerDescription(
  props: React.ComponentProps<typeof DialogDescription>,
) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <DrawerDescription {...props} />;
  }
  return <DialogDescription {...props} />;
}

export function DialogDrawerFooter(props: React.ComponentProps<"div">) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <DrawerFooter {...props} />;
  }
  return <DialogFooter {...props} />;
}
