import { BigCalendar } from "@rectangular-labs/ui/components/calendar/big-calendar";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/calendar",
)({
  component: PageComponent,
});

function PageComponent() {
  return (
    <div className="w-full bg-background">
      <BigCalendar />
    </div>
  );
}
