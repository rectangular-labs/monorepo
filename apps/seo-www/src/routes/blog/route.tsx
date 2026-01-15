import { ContentProvider } from "@rectangular-labs/content/ui/content-provider";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/blog")({
  component: Layout,
});

function Layout() {
  return (
    <ContentProvider api="/api/blog/search">
      <Outlet />
    </ContentProvider>
  );
}
