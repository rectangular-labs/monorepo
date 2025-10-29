"use client";

import { addDays, setHours, setMinutes } from "@rectangular-labs/ui/utils/date";
import { useState } from "react";
import { type CalendarEvent, EventCalendar } from "./event-calendar";

// Function to calculate days until next Sunday
const getDaysUntilNextSunday = (date: Date) => {
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday
  return day === 0 ? 0 : 7 - day; // If today is Sunday, return 0, otherwise calculate days until Sunday
};

// Store the current date to avoid repeated new Date() calls
const currentDate = new Date();

// Calculate the offset once to avoid repeated calculations
const daysUntilNextSunday = getDaysUntilNextSunday(currentDate);

// Sample events data with hardcoded times
const sampleEvents: CalendarEvent[] = [
  {
    id: "w1-0b",
    title: "Investor Call",
    description: "Update investors on company progress",
    start: setMinutes(
      setHours(addDays(currentDate, -13 + daysUntilNextSunday), 14),
      0,
    ),
    end: setMinutes(
      setHours(addDays(currentDate, -13 + daysUntilNextSunday), 15),
      0,
    ),
    label: "Investor Call",
    location: "Conference Room A",
    color: "blue",
  },
];

export function BigCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);

  const handleEventAdd = (event: CalendarEvent) => {
    setEvents([...events, event]);
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setEvents(
      events.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event,
      ),
    );
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId));
  };

  return (
    <EventCalendar
      events={events}
      initialView="week"
      onEventAdd={handleEventAdd}
      onEventDelete={handleEventDelete}
      onEventUpdate={handleEventUpdate}
    />
  );
}
