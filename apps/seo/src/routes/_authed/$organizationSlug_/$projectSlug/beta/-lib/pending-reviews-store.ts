import { useEffect, useState } from "react";
import type { PendingReview } from "./beta-mock-data";
import { mockPendingReviews } from "./beta-mock-data";

type Listener = () => void;

let pendingReviews: PendingReview[] = mockPendingReviews.map((r) => ({
  ...r,
  items: r.items.map((i) => ({ ...i })),
}));

const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l();
}

export function getPendingReviews() {
  return pendingReviews;
}

export function subscribePendingReviews(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

export function submitArticleForReview(args: {
  articleId: string;
  articleTitle: string;
  clusterId: string;
  clusterName?: string;
  changeSummary: string;
  intendedPublishDate?: string;
}) {
  const {
    articleId,
    articleTitle,
    clusterId,
    clusterName,
    changeSummary,
    intendedPublishDate,
  } = args;

  const defaultReviewId = `rev_${clusterId}`;
  const existingReview =
    pendingReviews.find((r) => r.id === defaultReviewId) ??
    pendingReviews.find((r) => r.clusterId === clusterId);

  const reviewId = existingReview?.id ?? defaultReviewId;
  const title =
    existingReview?.title ??
    `Review: ${clusterName ?? clusterId} — ${articleTitle}`;

  const itemId = `rev_item_${articleId}_${Date.now()}`;
  const item = {
    id: itemId,
    articleId,
    articleTitle,
    changeSummary,
    intendedPublishDate: intendedPublishDate ?? isoDay(daysFromNow(7)),
    status: "pending" as const,
  };

  if (!existingReview) {
    pendingReviews = [
      {
        id: reviewId,
        title,
        clusterId,
        dueDate: isoDay(new Date()),
        items: [item],
      },
      ...pendingReviews,
    ];
    notify();
    return { reviewId };
  }

  pendingReviews = pendingReviews.map((r) => {
    if (r.id !== reviewId) return r;

    const withoutSameArticle = r.items.filter((i) => i.articleId !== articleId);
    return { ...r, items: [item, ...withoutSameArticle] };
  });

  notify();
  return { reviewId };
}

export function usePendingReviews() {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribePendingReviews(() => setVersion((v) => v + 1));
    return () => {
      unsubscribe();
    };
  }, []);

  return getPendingReviews();
}
