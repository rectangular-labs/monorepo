import { docSource } from "@rectangular-labs/content";
import { ListDocsPage } from "@rectangular-labs/content/ui/list-docs-page";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getPageTree = createServerFn({ method: "GET" })
  .inputValidator((input: null | undefined) => input)
  .handler(() => docSource.pageTree as object);

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
