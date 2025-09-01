import { blogSource } from "@rectangular-labs/content";
import { PostPage } from "@rectangular-labs/content/ui/post-page";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getBlogData = createServerFn({ method: "GET" })
  .validator((slugs: string[]) => slugs)
  .handler(({ data: slugs }) => {
    const page = blogSource.getPage(slugs);
    if (!page) throw notFound();
    return {
      tree: blogSource.pageTree as object,
      data: page.data,
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
  const { data, tree: dataTree } = Route.useLoaderData();
  return <PostPage data={data} tree={dataTree} />;
}
