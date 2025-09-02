import { ContentProvider } from "@rectangular-labs/content/ui/content-provider";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  component: Layout,
});

function Layout() {
  return (
    <ContentProvider api="/api/docs/search">
      <Outlet />
    </ContentProvider>
  );
}
