"use client";

import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { addHours, addMinutes } from "@rectangular-labs/ui/utils/date";
import { type } from "arktype";
import { useEffect, useRef, useState } from "react";
import { CalendarEventSchema, type TimeBlock } from "../schema";

interface DroppableCellProps {
  date: Date;
  time?: number; // For week/day views, represents hours (e.g., 9.25 for 9:15)
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DroppableCell({
  date,
  time,
  children,
  className,
  onClick,
}: DroppableCellProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      throw new Error("ref not set correctly");
    }

    return dropTargetForElements({
      element: el,
      getData: (): TimeBlock => ({
        start: addHours(date, time ?? 0),
        end: addMinutes(date, 15),
      }),
      canDrop: ({ source }) => {
        const calendarEvent = CalendarEventSchema(source.data);
        return !(calendarEvent instanceof type.errors);
      },
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
    });
  }, [date, time]);

  // Format time for display in tooltip (only for debugging)
  const formattedTime =
    time !== undefined
      ? `${Math.floor(time)}:${Math.round((time - Math.floor(time)) * 60)
          .toString()
          .padStart(2, "0")}`
      : null;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: we want to interact with the cell
    // biome-ignore lint/a11y/useKeyWithClickEvents: we want to click on the cell
    <div
      className={cn(
        "flex h-full flex-col px-0.5 py-1 data-dragging:bg-accent sm:px-1",
        className,
      )}
      data-dragging={isOver ? true : undefined}
      onClick={onClick}
      ref={ref}
      title={formattedTime ? `${formattedTime}` : undefined}
    >
      {children}
    </div>
  );
}
