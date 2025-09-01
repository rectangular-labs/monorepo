import { TanstackProvider } from "fumadocs-core/framework/tanstack";
import { RootProvider } from "fumadocs-ui/provider/base";

export function ContentProvider({ children }: { children: React.ReactNode }) {
  return (
    <TanstackProvider>
      <RootProvider>{children}</RootProvider>
    </TanstackProvider>
  );
}
