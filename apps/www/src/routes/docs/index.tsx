import { source } from "@rectangular-labs/content";
import { ListDocsPage } from "@rectangular-labs/content/ui/list-docs-page";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getPageTree = createServerFn({ method: "GET" })
  .validator((input: null | undefined) => input)
  .handler(() => source.pageTree as object);

export const Route = createFileRoute("/docs/")({
  component: Page,
  loader: async () => {
    const tree = await getPageTree();
    return { tree };
  },
});

function Page() {
  const { tree } = Route.useLoaderData();
  return <ListDocsPage tree={tree} />;
}
