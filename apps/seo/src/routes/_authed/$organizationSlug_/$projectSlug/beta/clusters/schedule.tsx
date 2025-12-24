import { EventCalendar } from "@rectangular-labs/ui/components/calendar/event-calendar/event-calendar";
import type { CalendarEvent } from "@rectangular-labs/ui/components/calendar/event-calendar/schema";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { mockScheduleEvents } from "../-lib/beta-mock-data";
import { usePendingReviews } from "../-lib/pending-reviews-store";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta/clusters/schedule",
)({
  component: SchedulePage,
});

function SchedulePage() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const [events, setEvents] = useState<CalendarEvent[]>(mockScheduleEvents);
  const pendingReviews = usePendingReviews();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">
            Drag and drop to reschedule upcoming articles across clusters.
          </p>
        </div>
      </div>

      {pendingReviews.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2">
              <Icons.AlertTriangleIcon className="size-4 text-amber-500" />
              <div className="text-sm">
                <span className="font-medium">Pending reviews:</span>{" "}
                <span className="text-muted-foreground">
                  {pendingReviews.length} review(s) waiting.
                </span>
              </div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link
                params={{ organizationSlug, projectSlug }}
                to="/$organizationSlug/$projectSlug/beta/clusters/reviews"
              >
                View reviews
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-medium text-sm">Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <EventCalendar
            events={events}
            onEventAdd={(evt) => setEvents((prev) => [...prev, evt])}
            onEventDelete={(id) =>
              setEvents((prev) => prev.filter((e) => e.id !== id))
            }
            onEventUpdate={(evt) =>
              setEvents((prev) => prev.map((e) => (e.id === evt.id ? evt : e)))
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}


