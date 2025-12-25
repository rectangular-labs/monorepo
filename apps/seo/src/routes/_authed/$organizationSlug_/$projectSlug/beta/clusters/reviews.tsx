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
import { usePendingReviews } from "../-lib/pending-reviews-store";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta/clusters/reviews",
)({
  component: ReviewListPage,
});

function ReviewListPage() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const pendingReviews = usePendingReviews();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight">Review</h1>
          <p className="text-muted-foreground">
            Pending reviews across articles and clusters.
          </p>
        </div>
        <Badge variant="secondary">{pendingReviews.length} pending</Badge>
      </div>

      <div className="grid gap-4">
        {pendingReviews.map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">
                    {r.title}
                  </CardTitle>
                  <div className="text-muted-foreground text-sm">
                    {r.items.length} item(s) • due {r.dueDate}
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link
                    params={{ organizationSlug, projectSlug, reviewId: r.id }}
                    to="/$organizationSlug/$projectSlug/beta/clusters/review/$reviewId"
                  >
                    Open
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {r.items.map((i) => (
                <div
                  className="flex items-start gap-3 rounded-md border p-3"
                  key={i.id}
                >
                  <div className="mt-0.5 flex size-8 items-center justify-center rounded-md bg-muted">
                    <Icons.FileText className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-sm">
                      {i.articleTitle}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {i.changeSummary}
                    </div>
                  </div>
                  <Badge className="ml-auto" variant="secondary">
                    {i.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
