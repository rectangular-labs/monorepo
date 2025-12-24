import * as Icons from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useBetaUi } from "~/routes/_authed/-components/beta-ui-provider";
import type {
  Recommendation,
  RecommendationActionKind,
} from "../-lib/beta-mock-data";
import { mockRecommendations } from "../-lib/beta-mock-data";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta/clusters/site-recommendations",
)({
  component: SiteRecommendationsPage,
});

function priorityBadge(priority: Recommendation["priority"]) {
  const label =
    priority === "high"
      ? "High priority"
      : priority === "medium"
        ? "Medium"
        : "Low";
  const variant =
    priority === "high" ? ("default" as const) : ("secondary" as const);
  return <Badge variant={variant}>{label}</Badge>;
}

function actionChip(kind: RecommendationActionKind) {
  const label =
    kind === "expand" ? "Expand" : kind === "update" ? "Update" : "Remove";
  const icon =
    kind === "expand" ? (
      <Icons.TrendingUp className="size-3.5" />
    ) : kind === "update" ? (
      <Icons.RefreshCcw className="size-3.5" />
    ) : (
      <Icons.Trash className="size-3.5" />
    );

  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-muted-foreground text-xs">
      {icon}
      {label}
    </span>
  );
}

function SiteRecommendationsPage() {
  const betaUi = useBetaUi();
  const { organizationSlug, projectSlug } = Route.useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight">
            Site recommendations
          </h1>
          <p className="text-muted-foreground">
            A prioritized list of next-best actions. Each recommendation can
            combine expansions, updates, and cleanup.
          </p>
        </div>
        <Badge variant="secondary">Mocked</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockRecommendations.map((rec) => (
          <RecommendationCard
            key={rec.id}
            onChat={() => {
              const actionLines = rec.actions
                .map(
                  (a) => `- ${a.kind.toUpperCase()}: ${a.label} — ${a.detail}`,
                )
                .join("\n");
              const clusterLines = rec.clusters
                .map((c) => `- ${c.name} (pillar: ${c.pillarKeyword})`)
                .join("\n");

              betaUi.runChatAction(
                `Recommendation: "${rec.title}"\n\nSummary: ${rec.summary}\n\nTargets:\n${clusterLines}\n\nProposed actions:\n${actionLines}\n\nReturn: concrete steps + page list (if expand), exact edits (if update), redirects/deindex plan (if remove), and an internal linking plan.`,
              );
            }}
            organizationSlug={organizationSlug}
            projectSlug={projectSlug}
            rec={rec}
          />
        ))}
      </div>
    </div>
  );
}

function RecommendationCard({
  rec,
  onChat,
  organizationSlug,
  projectSlug,
}: {
  rec: Recommendation;
  onChat: () => void;
  organizationSlug: string;
  projectSlug: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-base">{rec.title}</CardTitle>
            <p className="text-muted-foreground text-sm">{rec.summary}</p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {priorityBadge(rec.priority)}
            <Badge variant="secondary">Mocked</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs">Actions:</span>
          {Array.from(new Set(rec.actions.map((a) => a.kind))).map((k) => (
            <span key={k}>{actionChip(k)}</span>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-muted-foreground text-xs">Targets</div>
            <div className="flex flex-wrap gap-2">
              {rec.clusters.map((c) => (
                <Button asChild key={c.id} size="sm" variant="outline">
                  <Link
                    params={{ organizationSlug, projectSlug, clusterId: c.id }}
                    to="/$organizationSlug/$projectSlug/beta/clusters/cluster/$clusterId"
                  >
                    {c.name}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-muted-foreground text-xs">
              Proposed actions
            </div>
            <ul className="space-y-1 text-sm">
              {rec.actions.map((a) => (
                <li className="flex items-start gap-2" key={a.id}>
                  <span className="mt-2 inline-block size-1.5 rounded-full bg-muted-foreground/60" />
                  <div className="min-w-0">
                    <div className="font-medium">{a.label}</div>
                    <div className="text-muted-foreground text-xs">
                      {a.detail}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button onClick={onChat} size="sm" variant="outline">
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
