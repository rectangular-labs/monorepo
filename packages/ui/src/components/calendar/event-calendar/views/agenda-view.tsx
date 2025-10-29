"use client";

import { addDays, isSameDay } from "@rectangular-labs/ui/utils/date";
import { format } from "date-fns";
import { CalendarRangeIcon } from "lucide-react";
import { useMemo } from "react";
import { AgendaDaysToShow } from "../constants";
import { EventItem } from "../event-item";
import type { CalendarEvent } from "../schema";
import { getEventsForDay } from "../utils";

interface AgendaViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
}

export function AgendaView({
  currentDate,
  events,
  onEventSelect,
}: AgendaViewProps) {
  // Show events for the next days based on constant
  const days = useMemo(() => {
    return Array.from({ length: AgendaDaysToShow }, (_, i) =>
      addDays(new Date(currentDate), i),
    );
  }, [currentDate]);

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventSelect(event);
  };

  // Check if there are any days with events
  const hasEvents = days.some(
    (day) => getEventsForDay(events, day, true).length > 0,
  );

  return (
    <div className="border-border/70 border-t ps-4">
      {!hasEvents ? (
        <div className="flex min-h-[70svh] flex-col items-center justify-center py-16 text-center">
          <CalendarRangeIcon
            className="mb-2 text-muted-foreground/50"
            size={32}
          />
          <h3 className="font-medium text-lg">No events found</h3>
          <p className="text-muted-foreground">
            There are no events scheduled for this time period.
          </p>
        </div>
      ) : (
        days.map((day) => {
          const dayEvents = getEventsForDay(events, day, true);

          if (dayEvents.length === 0) return null;

          return (
            <div
              className="relative my-12 border-border/70 border-t"
              key={day.toString()}
            >
              <span
                className="-top-3 absolute left-0 flex h-6 items-center bg-background pe-4 text-[10px] uppercase data-today:font-medium sm:pe-4 sm:text-xs"
                data-today={isSameDay(day, new Date()) || undefined}
              >
                {format(day, "d MMM, EEEE")}
              </span>
              <div className="mt-6 space-y-2">
                {dayEvents.map((event) => (
                  <EventItem
                    event={event}
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    view="agenda"
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
