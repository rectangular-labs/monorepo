import { docSource } from "@rectangular-labs/content";
import { DocPage } from "@rectangular-labs/content/ui/doc-page";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getDocData = createServerFn({
  method: "GET",
})
  .validator((slugs: string[]) => slugs)
  .handler(({ data: slugs }) => {
    const page = docSource.getPage(slugs);
    if (!page) throw notFound();

    return {
      tree: docSource.pageTree as object,
      path: page.path,
      data: page.data,
    };
  });

export const Route = createFileRoute("/docs/$")({
  component: Page,
  loader: async ({ params }) => {
    const _params = params as unknown as { _splat?: string };
    const data = await getDocData({ data: _params._splat?.split("/") ?? [] });
    return data;
  },
});

function Page() {
  const { data, tree: dataTree } = Route.useLoaderData();
  return <DocPage data={data} tree={dataTree} />;
}
