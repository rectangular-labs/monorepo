import * as Icons from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { Separator } from "@rectangular-labs/ui/components/ui/separator";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ClusterStatus, ClusterTreeNode } from "../-lib/beta-mock-data";
import { mockClusters } from "../-lib/beta-mock-data";
import { submitArticleForReview } from "../-lib/pending-reviews-store";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta/clusters/article/$articleId",
)({
  component: ClusterArticlePage,
});

function findArticle(
  nodes: ClusterTreeNode[],
  articleId: string,
): Extract<ClusterTreeNode, { type: "file" }> | undefined {
  for (const n of nodes) {
    if (n.type === "file" && n.id === articleId) return n;
    if (n.type === "folder") {
      const found = findArticle(n.children, articleId);
      if (found) return found;
    }
  }
  return undefined;
}

function findClusterForArticleId(articleId: string) {
  for (const c of mockClusters) {
    const found = findArticle(c.tree, articleId);
    if (found) return { cluster: c, article: found };
  }
  return undefined;
}

function ClusterArticlePage() {
  const { organizationSlug, projectSlug, articleId } = Route.useParams();
  const navigate = useNavigate();

  const found = useMemo(() => findClusterForArticleId(articleId), [articleId]);
  const article = found?.article;
  const cluster = found?.cluster;

  const [draft, setDraft] = useState<{
    title: string;
    targetKeyword: string;
    secondaryKeywords: string;
    content: string;
    status: ClusterStatus;
  }>(() => ({
    title: article?.title ?? "",
    targetKeyword: article?.targetKeyword ?? "",
    secondaryKeywords: (article?.secondaryKeywords ?? []).join(", "),
    content: article?.content ?? "",
    status: article?.status ?? "draft",
  }));

  if (!article) {
    return (
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Article</h1>
        <p className="text-muted-foreground">Article not found (mock).</p>
      </div>
    );
  }

  const ctrPct = `${Math.round(article.metrics.ctr * 1000) / 10}%`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
              <Link
                className="hover:text-foreground hover:underline"
                params={{
                  organizationSlug,
                  projectSlug,
                  articleId: article.id,
                }}
                to="/$organizationSlug/$projectSlug/beta/clusters/article/$articleId"
              >
                {article.id}
              </Link>
              <span>/</span>
              <span className="truncate text-foreground">{article.title}</span>
            </div>
            <h1 className="truncate font-semibold text-2xl tracking-tight">
              {article.title}
            </h1>
            <p className="text-muted-foreground">
              Target keyword:{" "}
              <span className="text-foreground">{article.targetKeyword}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Mocked</Badge>
            <Badge variant="secondary">{draft.status}</Badge>
            <Button
              onClick={() => {
                setDraft((d) => ({ ...d, status: "review" }));

                const changeParts: string[] = [];
                if (draft.title !== article.title) changeParts.push("title");
                if (draft.targetKeyword !== article.targetKeyword)
                  changeParts.push("target keyword");
                if (
                  draft.secondaryKeywords !==
                  (article.secondaryKeywords ?? []).join(", ")
                )
                  changeParts.push("secondary keywords");
                if (draft.content !== article.content)
                  changeParts.push("content");

                const changeSummary =
                  changeParts.length > 0
                    ? `Submitted changes for review (mock): ${changeParts.join(", ")}.`
                    : "Submitted for review (mock).";

                const { reviewId } = submitArticleForReview({
                  articleId: article.id,
                  articleTitle: draft.title || article.title,
                  clusterId: cluster?.id ?? "unknown_cluster",
                  clusterName: cluster?.name,
                  changeSummary,
                  intendedPublishDate: article.intendedPublishDate,
                });

                void navigate({
                  to: "/$organizationSlug/$projectSlug/beta/clusters/review/$reviewId",
                  params: { organizationSlug, projectSlug, reviewId },
                });
              }}
              variant="outline"
            >
              <Icons.Sparkles className="mr-2 size-4" />
              Submit for review
            </Button>
          </div>
        </div>
        <Separator />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="font-medium text-sm">Article</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              onChange={(e) =>
                setDraft((d) => ({ ...d, content: e.target.value }))
              }
              rows={14}
              value={draft.content}
            />
            <div className="rounded-md bg-muted/30 p-3 text-sm">
              <div className="mb-1 font-medium text-xs">Preview (mock)</div>
              <pre className="whitespace-pre-wrap text-muted-foreground">
                {draft.content}
              </pre>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs">Title</div>
                <Input
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  value={draft.title}
                />
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs">
                  Target keyword
                </div>
                <Input
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, targetKeyword: e.target.value }))
                  }
                  value={draft.targetKeyword}
                />
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs">
                  Secondary keywords (comma-separated)
                </div>
                <Input
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      secondaryKeywords: e.target.value,
                    }))
                  }
                  value={draft.secondaryKeywords}
                />
              </div>

              <Separator />

              <div className="grid gap-2 text-sm">
                {article.url && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground text-xs">URL</span>
                    <span className="truncate font-medium text-xs">
                      {article.url}
                    </span>
                  </div>
                )}
                {article.publishedAt && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground text-xs">
                      Published
                    </span>
                    <span className="font-medium text-xs">
                      {article.publishedAt}
                    </span>
                  </div>
                )}
                {article.intendedPublishDate && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground text-xs">
                      Intended
                    </span>
                    <span className="font-medium text-xs">
                      {article.intendedPublishDate}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-sm">Performance</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Stat
                label="Clicks"
                value={article.metrics.clicks.toLocaleString()}
              />
              <Stat
                label="Impr"
                value={article.metrics.impressions.toLocaleString()}
              />
              <Stat label="CTR" value={ctrPct} />
              <Stat label="Pos" value={String(article.metrics.position)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-sm">
                LLM visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <GoalStat
                goal={`${article.llm.goals.visibilityScore}%`}
                label="Score"
                value={`${article.llm.current.visibilityScore}%`}
              />
              <GoalStat
                goal={`${article.llm.goals.answerShare}%`}
                label="Answer share"
                value={`${article.llm.current.answerShare}%`}
              />
              <GoalStat
                goal={String(article.llm.goals.citations)}
                label="Citations"
                value={String(article.llm.current.citations)}
              />
              <GoalStat
                goal={String(article.llm.goals.mentions)}
                label="Mentions"
                value={String(article.llm.current.mentions)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 font-semibold text-sm tabular-nums">{value}</div>
    </div>
  );
}

function GoalStat({
  label,
  value,
  goal,
}: {
  label: string;
  value: string;
  goal: string;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between gap-2 text-muted-foreground text-xs">
        <span>{label}</span>
        <span className="tabular-nums">goal {goal}</span>
      </div>
      <div className="mt-1 font-semibold text-sm tabular-nums">{value}</div>
    </div>
  );
}
