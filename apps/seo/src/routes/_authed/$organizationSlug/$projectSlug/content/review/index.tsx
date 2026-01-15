"use client";

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/review/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$organizationSlug/$projectSlug/content/review/outlines",
      params,
    });
  },
});
