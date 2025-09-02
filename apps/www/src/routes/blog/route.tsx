import { ContentProvider } from "@rectangular-labs/content/ui/content-provider";
import { PostsLayout } from "@rectangular-labs/content/ui/post-card";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/blog")({
  component: Layout,
});

function Layout() {
  return (
    <ContentProvider api="/api/blog/search">
      <PostsLayout>
        <Outlet />
      </PostsLayout>
    </ContentProvider>
  );
}
