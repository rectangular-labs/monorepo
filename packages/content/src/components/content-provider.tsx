import { TanstackProvider } from "fumadocs-core/framework/tanstack";
import { RootProvider } from "fumadocs-ui/provider/base";
import { SearchDialogComponent } from "./search";

export function ContentProvider({
  children,
  api,
}: {
  children: React.ReactNode;
  api: "/api/blog/search" | "/api/docs/search";
}) {
  return (
    <TanstackProvider>
      <RootProvider
        search={{
          SearchDialog: (args) => SearchDialogComponent({ ...args, api }),
        }}
      >
        {children}
      </RootProvider>
    </TanstackProvider>
  );
}
