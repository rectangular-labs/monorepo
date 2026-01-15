import { seoBlogSource } from "@rectangular-labs/content";
import { getPostsOverview } from "@rectangular-labs/content/get-posts-overview";
import { BlogPost } from "@rectangular-labs/content/ui/blog-post";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getBlogData = createServerFn({ method: "GET" })
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = seoBlogSource.getPage(slugs);
    if (!page) throw notFound();
    return {
      tree: seoBlogSource.pageTree as object,
      data: page.data,
      postsOverview: await getPostsOverview(seoBlogSource),
    };
  });

export const Route = createFileRoute("/blog/$")({
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
