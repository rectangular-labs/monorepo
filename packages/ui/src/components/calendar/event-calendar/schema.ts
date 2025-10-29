import { type } from "arktype";

export const CalendarViewSchema = type("'month' | 'week' | 'day' | 'agenda'");
export type CalendarView = typeof CalendarViewSchema.infer;

export const EventColorSchema = type(
  "'blue' | 'violet' | 'rose' | 'emerald' | 'orange'",
);
export type EventColor = typeof EventColorSchema.infer;

export const CalendarEventSchema = type({
  id: "string",
  title: "string",
  "description?": "string",
  start: "Date",
  end: "Date",
  "label?": "string",
  "location?": "string",
  color: EventColorSchema,
});
export type CalendarEvent = typeof CalendarEventSchema.infer;

export const TimeBlockSchema = type({
  start: "Date",
  end: "Date",
});
export type TimeBlock = typeof TimeBlockSchema.infer;
