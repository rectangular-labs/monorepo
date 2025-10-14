import { blogSource } from "@rectangular-labs/content";
import { getPostsOverview } from "@rectangular-labs/content/get-posts-overview";
import { BlogSection } from "@rectangular-labs/content/ui/blog-section";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getBlogTree = createServerFn({ method: "GET" }).handler(() =>
  getPostsOverview(blogSource),
);

export const Route = createFileRoute("/_marketing/blog/")({
  component: Page,
  loader: async () => {
    const postOverview = await getBlogTree();
    return { postOverview };
  },
});

function Page() {
  const { postOverview } = Route.useLoaderData();

  if (postOverview.length === 0) {
    return (
      <Section>
        <p className="text-center text-muted-foreground">No posts found.</p>
      </Section>
    );
  }

  return <BlogSection postsOverview={postOverview} title="Latest articles" />;
}
