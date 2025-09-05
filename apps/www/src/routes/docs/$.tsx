import { docSource } from "@rectangular-labs/content";
import { getPostsOverview } from "@rectangular-labs/content/get-posts-overview";
import { DocPage } from "@rectangular-labs/content/ui/doc-page";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getDocData = createServerFn({
  method: "GET",
})
  .validator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = docSource.getPage(slugs);
    if (!page) throw notFound();

    const postsOverview = await getPostsOverview();

    return {
      path: page.path,
      data: page.data,
      postsOverview,
      tree: docSource.pageTree as object,
    };
  });

export const Route = createFileRoute("/docs/$")({
  component: Page,
  loader: async ({ params }) => {
    const data = await getDocData({ data: params._splat?.split("/") ?? [] });
    return data;
  },
});

function Page() {
  const { data, tree } = Route.useLoaderData();
  return <DocPage data={data} tree={tree} />;
}
