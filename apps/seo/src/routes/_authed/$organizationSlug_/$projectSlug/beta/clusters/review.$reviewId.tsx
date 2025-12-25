import * as Icons from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import { useBetaUi } from "~/routes/_authed/-components/beta-ui-provider";
import { usePendingReviews } from "../-lib/pending-reviews-store";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta/clusters/review/$reviewId",
)({
  component: ReviewDetailPage,
});

function ReviewDetailPage() {
  const betaUi = useBetaUi();
  const { reviewId } = Route.useParams();
  const pendingReviews = usePendingReviews();
  const review = pendingReviews.find((r) => r.id === reviewId);

  if (!review) {
    return (
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Review</h1>
        <p className="text-muted-foreground">Review not found (mock).</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="truncate font-semibold text-2xl tracking-tight">
            {review.title}
          </h1>
          <p className="text-muted-foreground">
            Review {review.items.length} change(s) and approve or send back to
            chat.
          </p>
        </div>
        <Badge variant="secondary">Due {review.dueDate}</Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-medium text-sm">Pending items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {review.items.map((i) => (
            <div className="rounded-md border p-3" key={i.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium text-sm">
                    {i.articleTitle}
                  </div>
                  <div className="mt-1 space-y-1 text-muted-foreground text-xs">
                    <div>{i.changeSummary}</div>
                    <div>
                      Intended publish:{" "}
                      <span className="text-foreground">
                        {i.intendedPublishDate}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{i.status}</Badge>
                  <Button
                    onClick={() =>
                      betaUi.runChatAction(
                        `Review feedback for "${i.articleTitle}": propose final edits and approval checklist.`,
                      )
                    }
                    size="sm"
                    variant="outline"
                  >
                    <Icons.Sparkles className="mr-2 size-4" />
                    Chat
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div className="rounded-md bg-muted/40 p-3 text-sm">
                  <div className="mb-1 font-medium text-xs">Before (mock)</div>
                  <p className="text-muted-foreground">
                    Title and intro are generic; GEO angle missing; comparison
                    table outdated.
                  </p>
                </div>
                <div className="rounded-md bg-muted/40 p-3 text-sm">
                  <div className="mb-1 font-medium text-xs">After (mock)</div>
                  <p className="text-muted-foreground">
                    Add GEO “mentioned in AI answers” section; refresh pricing;
                    add FAQ block.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
