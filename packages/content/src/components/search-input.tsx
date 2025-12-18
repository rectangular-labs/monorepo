import { Search } from "@rectangular-labs/ui/components/icon";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { useSearchContext } from "fumadocs-ui/contexts/search";

export function SearchInput() {
  const { setOpenSearch } = useSearchContext();
  return (
    <div className="relative">
      <Search className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="relative w-full pl-8"
        onClick={() => setOpenSearch(true)}
        placeholder="Search"
      />
      <kbd className="absolute top-1/2 right-2 flex -translate-y-1/2 gap-1 text-muted-foreground">
        <kbd>⌘</kbd>
        <kbd>K</kbd>
      </kbd>
    </div>
  );
}
