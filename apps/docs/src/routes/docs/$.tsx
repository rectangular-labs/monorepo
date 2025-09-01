import { source } from "@rectangular-labs/content";
import { DocPage } from "@rectangular-labs/content/ui/doc-page";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

// a wrapper because we don't want `loader` to be called on client-side
const getDocData = createServerFn({
  method: "GET",
})
  .validator((slugs: string[]) => slugs)
  .handler(({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    return {
      tree: source.pageTree as object,
      path: page.path,
      data: page.data,
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
  const { data, tree: dataTree } = Route.useLoaderData();
  return <DocPage data={data} tree={dataTree} />;
}
