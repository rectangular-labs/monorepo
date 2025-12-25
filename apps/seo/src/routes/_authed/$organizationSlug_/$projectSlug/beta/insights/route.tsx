import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { createFileRoute, Outlet, Link } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta/insights",
)({
  component: InsightsLayout,
});

const navItems = [
  {
    label: "Overview",
    to: "/$organizationSlug/$projectSlug/beta/insights" as const,
  },
  {
    label: "Contextual performance",
    to: "/$organizationSlug/$projectSlug/beta/insights/contextual-performance" as const,
  },
  {
    label: "Site performance",
    to: "/$organizationSlug/$projectSlug/beta/insights/site-performance" as const,
  },
  {
    label: "Cluster performance",
    to: "/$organizationSlug/$projectSlug/beta/insights/cluster-performance" as const,
  },
] as const;

function InsightsLayout() {
  const { organizationSlug, projectSlug } = Route.useParams();

  return (
    <div className="flex h-full w-full">
      <aside className="w-72 shrink-0 border-r bg-background p-4">
        <div className="mb-4 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base">Insights</h2>
            <Badge variant="secondary">Beta</Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Brand visibility, performance, and next-best actions.
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              activeOptions={{
                exact:
                  item.to === "/$organizationSlug/$projectSlug/beta/insights",
              }}
              activeProps={{
                className:
                  "bg-muted text-foreground hover:bg-muted font-medium",
              }}
              className={cn(
                "rounded-md px-3 py-2 text-muted-foreground text-sm hover:bg-muted/40 hover:text-foreground",
              )}
              key={item.to}
              params={{ organizationSlug, projectSlug }}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-7xl p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
