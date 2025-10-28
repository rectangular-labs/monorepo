"use client";

import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { type } from "arktype";
import { useEffect, useRef } from "react";
import {
  type CalendarEvent,
  CalendarEventSchema,
  TimeBlockSchema,
} from "../schema";

interface CalendarDndProviderProps {
  onEventUpdate: (event: CalendarEvent) => void;
}
export function CalendarDndListener({
  onEventUpdate,
}: CalendarDndProviderProps) {
  const eventUpdateRef =
    useRef<CalendarDndProviderProps["onEventUpdate"]>(onEventUpdate);

  useEffect(() => {
    const cleanup = monitorForElements({
      canMonitor: ({ source }) =>
        !(CalendarEventSchema(source.data) instanceof type.errors),
      onDragStart: ({ source }) => {
        const calendarEvent = CalendarEventSchema(source.data);
        if (calendarEvent instanceof type.errors) {
          return;
        }
      },
      onDrop({ source, location }) {
        const calendarEvent = CalendarEventSchema(source.data);
        const timeBlock = TimeBlockSchema(
          location.current.dropTargets[0]?.data,
        );
        if (
          calendarEvent instanceof type.errors ||
          timeBlock instanceof type.errors
        ) {
          return;
        }
        console.log("calendarEvent.end.getTime()", calendarEvent.end.getTime());
        console.log(
          "calendarEvent.start.getTime()",
          calendarEvent.start.getTime(),
        );
        console.log("timeBlock.start.getTime() ", timeBlock.start.getTime());
        eventUpdateRef.current({
          ...calendarEvent,
          start: timeBlock.start,
          end: new Date(
            timeBlock.start.getTime() +
              (calendarEvent.end.getTime() - calendarEvent.start.getTime()),
          ),
        });
      },
    });

    return () => {
      cleanup();
    };
  }, []);

  return null;
}
