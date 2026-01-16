import { createDb, schema } from "@rectangular-labs/db";
import { createFileRoute } from "@tanstack/react-router";
import { serverEnv } from "~/lib/env";

function isValidEmail(email: string) {
  // Simple, pragmatic validation (avoid rejecting valid-but-uncommon emails).
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const Route = createFileRoute("/api/waitlist")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const env = serverEnv();
        const adminToken = env.WAITLIST_ADMIN_TOKEN;
        if (!adminToken) {
          return Response.json(
            { ok: false, error: "Not found" },
            { status: 404 },
          );
        }

        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        if (token !== adminToken) {
          return Response.json(
            { ok: false, error: "Unauthorized" },
            { status: 401 },
          );
        }

        const format = url.searchParams.get("format");
        const db = createDb();

        const items = await db.query.seoWaitlistSignup.findMany({
          columns: {
            email: true,
            source: true,
            createdAt: true,
          },
          orderBy: (t, { desc }) => [desc(t.createdAt)],
        });

        if (format === "csv") {
          const header = "email,source,createdAt";
          const rows = items.map((i) => {
            const createdAt = i.createdAt.toISOString();
            // Basic CSV escaping: wrap fields and escape quotes.
            const esc = (v: string) => `"${v.replaceAll('"', '""')}"`;
            return [esc(i.email), esc(i.source), esc(createdAt)].join(",");
          });
          const csv = [header, ...rows].join("\n");
          return new Response(csv, {
            status: 200,
            headers: {
              "content-type": "text/csv; charset=utf-8",
              "content-disposition": 'attachment; filename="waitlist.csv"',
            },
          });
        }

        return Response.json({ ok: true, items });
      },
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { ok: false, error: "Invalid JSON body" },
            { status: 400 },
          );
        }

        const email =
          typeof body === "object" && body !== null && "email" in body
            ? (body as { email?: unknown }).email
            : undefined;

        if (typeof email !== "string" || !isValidEmail(email)) {
          return Response.json(
            { ok: false, error: "Invalid email" },
            { status: 400 },
          );
        }

        const env = serverEnv();
        const db = createDb();

        const inserted = await db
          .insert(schema.seoWaitlistSignup)
          .values({
            email,
            source: "seo-www",
          })
          .onConflictDoNothing({
            target: schema.seoWaitlistSignup.email,
          })
          .returning();

        const status =
          inserted.length > 0 ? "registered" : "already_registered";

        const webhookUrl = env.WAITLIST_WEBHOOK_URL;

        // Only forward to webhook on first registration to avoid duplicates.
        if (webhookUrl && status === "registered") {
          try {
            await fetch(webhookUrl, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                email,
                source: "seo-www",
                createdAt: new Date().toISOString(),
              }),
            });
          } catch {
            // Still return success so UX isn't brittle; webhook delivery can be monitored separately.
          }
        }

        return Response.json({ ok: true, status });
      },
    },
  },
});
