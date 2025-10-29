"use client";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useEffect, useRef, useState } from "react";
import { EventItem } from "../event-item";
import type { CalendarEvent } from "../schema";

interface DraggableEventProps {
  event: CalendarEvent;
  view: "month" | "week" | "day";
  showTime?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  height?: number;
  isFirstDay?: boolean;
  isLastDay?: boolean;
  "aria-hidden"?: boolean | "true" | "false";
}

export function DraggableEvent({
  event,
  view,
  showTime,
  onClick,
  height,
  isFirstDay = true,
  isLastDay = true,
  "aria-hidden": ariaHidden,
}: DraggableEventProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  useEffect(() => {
    const el = elementRef.current;
    if (!el) {
      return;
    }
    return draggable({
      element: el,
      getInitialData: (): CalendarEvent => event,
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, [event]);

  // Don't render if this event is being dragged
  if (isDragging) {
    return (
      <div
        className="opacity-0"
        ref={elementRef}
        style={{ height: height || "auto" }}
      />
    );
  }

  return (
    <div className="touch-none" ref={elementRef}>
      <EventItem
        aria-hidden={ariaHidden}
        event={event}
        isDragging={isDragging}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        onClick={onClick}
        showTime={showTime}
        view={view}
      />
    </div>
  );
}
