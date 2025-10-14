import { blogSource } from "@rectangular-labs/content";
import { getPostsOverview } from "@rectangular-labs/content/get-posts-overview";
import { BlogPost } from "@rectangular-labs/content/ui/blog-post";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getBlogData = createServerFn({ method: "GET" })
  .validator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = blogSource.getPage(slugs);
    if (!page) throw notFound();
    return {
      tree: blogSource.pageTree as object,
      data: page.data,
      postsOverview: await getPostsOverview(blogSource),
    };
  });

export const Route = createFileRoute("/_marketing/blog/$")({
  component: Page,
  loader: async ({ params }) => {
    const data = await getBlogData({ data: params._splat?.split("/") ?? [] });
    return data;
  },
});

function Page() {
  const { data, postsOverview, tree } = Route.useLoaderData();
  return <BlogPost data={data} postsOverview={postsOverview} tree={tree} />;
}
