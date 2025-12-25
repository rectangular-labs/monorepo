import * as Icons from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { Separator } from "@rectangular-labs/ui/components/ui/separator";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useBetaUi } from "~/routes/_authed/-components/beta-ui-provider";
import type { ClusterTreeNode } from "../-lib/beta-mock-data";
import { mockClusters } from "../-lib/beta-mock-data";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta/clusters/cluster/$clusterId",
)({
  component: ClusterDetailPage,
});

function ClusterDetailPage() {
  const betaUi = useBetaUi();
  const { organizationSlug, projectSlug, clusterId } = Route.useParams();
  const cluster = mockClusters.find((c) => c.id === clusterId);

  if (!cluster) {
    return (
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Cluster</h1>
        <p className="text-muted-foreground">Cluster not found (mock).</p>
      </div>
    );
  }

  const range = "28d" as const;
  const m = cluster.metrics[range].current;
  const llm = cluster.llm;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Link
              className="hover:text-foreground hover:underline"
              params={{ organizationSlug, projectSlug }}
              to="/$organizationSlug/$projectSlug/beta/clusters/clusters"
            >
              Clusters
            </Link>
            <span>/</span>
            <span className="truncate text-foreground">{cluster.name}</span>
          </div>
          <h1 className="truncate font-semibold text-2xl tracking-tight">
            {cluster.name}
          </h1>
          <p className="text-muted-foreground">
            Pillar keyword:{" "}
            <span className="text-foreground">{cluster.pillarKeyword}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              betaUi.runChatAction(
                `Expand cluster: "${cluster.name}" — generate content tree and next 2-week schedule.`,
              )
            }
            variant="outline"
          >
            <Icons.Sparkles className="mr-2 size-4" />
            Expand
          </Button>
          <Button
            onClick={() =>
              betaUi.runChatAction(
                `Update cluster: "${cluster.name}" — identify declining pages and propose edits.`,
              )
            }
            variant="outline"
          >
            <Icons.RefreshCcw className="mr-2 size-4" />
            Update
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Clicks" value={m.clicks} />
        <Metric label="Impressions" value={m.impressions} />
        <Metric label="CTR" value={`${Math.round(m.ctr * 1000) / 10}%`} />
        <Metric label="Avg position" value={m.position} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-medium text-sm">Goals</CardTitle>
            <Badge variant="secondary">Mocked</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Goal label="Clicks" value={cluster.goal.clicks} />
          <Goal label="Impressions" value={cluster.goal.impressions} />
          <Goal label="By date" value={cluster.goal.byDate} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-medium text-sm">
              LLM visibility
            </CardTitle>
            <Badge variant="secondary">Mocked</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <LlmStat
            current={llm.current.visibilityScore}
            goal={llm.goals.visibilityScore}
            label="Visibility score"
            suffix="%"
          />
          <LlmStat
            current={llm.current.citations}
            goal={llm.goals.citations}
            label="Citations"
          />
          <LlmStat
            current={llm.current.mentions}
            goal={llm.goals.mentions}
            label="Mentions"
          />
          <LlmStat
            current={llm.current.answerShare}
            goal={llm.goals.answerShare}
            label="Answer share"
            suffix="%"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-medium text-sm">Content tree</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Folders are target keywords (sub-clusters). Files are articles. The
            top-level file is the pillar page for this cluster.
          </p>
          <Separator />
          <Tree
            clusterId={cluster.id}
            nodes={cluster.tree}
            organizationSlug={organizationSlug}
            pillarKeyword={cluster.pillarKeyword}
            projectSlug={projectSlug}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-2 font-semibold text-xl tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

function Goal({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 font-medium text-sm tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

function LlmStat({
  label,
  current,
  goal,
  suffix,
}: {
  label: string;
  current: number;
  goal: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <div className="font-semibold text-lg tabular-nums">
          {current.toLocaleString()}
          {suffix ?? ""}
        </div>
        <div className="text-muted-foreground text-xs tabular-nums">
          goal {goal.toLocaleString()}
          {suffix ?? ""}
        </div>
      </div>
    </div>
  );
}

function Tree({
  nodes,
  organizationSlug,
  projectSlug,
  clusterId,
  pillarKeyword,
}: {
  nodes: ClusterTreeNode[];
  organizationSlug: string;
  projectSlug: string;
  clusterId: string;
  pillarKeyword: string;
}) {
  return (
    <ul className="space-y-2">
      {nodes.map((n) => (
        <TreeNode
          clusterId={clusterId}
          depth={0}
          key={n.id}
          node={n}
          organizationSlug={organizationSlug}
          pillarKeyword={pillarKeyword}
          projectSlug={projectSlug}
        />
      ))}
    </ul>
  );
}

function statusBadge(status: string) {
  const cls =
    status === "published"
      ? "bg-emerald-500/10 text-emerald-500"
      : status === "scheduled"
        ? "bg-blue-500/10 text-blue-500"
        : status === "review"
          ? "bg-amber-500/10 text-amber-500"
          : "bg-muted text-muted-foreground";
  return (
    <span className={cn("rounded-full px-2 py-1 text-xs", cls)}>{status}</span>
  );
}

function TreeNode({
  node,
  depth,
  organizationSlug,
  projectSlug,
  clusterId,
  pillarKeyword,
}: {
  node: ClusterTreeNode;
  depth: number;
  organizationSlug: string;
  projectSlug: string;
  clusterId: string;
  pillarKeyword: string;
}) {
  const indent = { paddingLeft: `${depth * 14}px` };

  if (node.type === "folder") {
    return (
      <li>
        <div
          className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
          style={indent}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Icons.FolderOpen className="size-4 text-muted-foreground" />
            <div className="min-w-0">
              <div className="truncate font-medium text-sm">{node.keyword}</div>
              {(node.description || (node.variants?.length ?? 0) > 0) && (
                <div className="truncate text-muted-foreground text-xs">
                  {node.description ?? ""}
                  {node.description && (node.variants?.length ?? 0) > 0
                    ? " • "
                    : ""}
                  {(node.variants ?? []).slice(0, 2).join(", ")}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span className="tabular-nums">{node.metrics.clicks} clicks</span>
            <span className="tabular-nums">
              {node.metrics.impressions} impr
            </span>
          </div>
        </div>
        <ul className="mt-2 space-y-2">
          {node.children.map((c) => (
            <TreeNode
              clusterId={clusterId}
              depth={depth + 1}
              key={c.id}
              node={c}
              organizationSlug={organizationSlug}
              pillarKeyword={pillarKeyword}
              projectSlug={projectSlug}
            />
          ))}
        </ul>
      </li>
    );
  }

  const isPillar = node.targetKeyword === pillarKeyword;

  return (
    <li>
      <Link
        className="block"
        params={{
          organizationSlug,
          projectSlug,
          articleId: node.id,
        }}
        to="/$organizationSlug/$projectSlug/beta/clusters/article/$articleId"
      >
        <div
          className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 hover:bg-muted/40"
          style={indent}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Icons.FileText className="size-4 text-muted-foreground" />
            <div className="min-w-0">
              <div className="truncate text-sm">
                {node.title}{" "}
                {isPillar && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
                    Pillar
                  </span>
                )}
              </div>
              <div className="truncate text-muted-foreground text-xs">
                Target: {node.targetKeyword}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusBadge(node.status)}
            <span className="text-muted-foreground text-xs tabular-nums">
              {node.metrics.clicks} clicks
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
