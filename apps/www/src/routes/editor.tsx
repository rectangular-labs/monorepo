import { SimpleEditor } from "@rectangular-labs/editor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/editor")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SimpleEditor />;
}
