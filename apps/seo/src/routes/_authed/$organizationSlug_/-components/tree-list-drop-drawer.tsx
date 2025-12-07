import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerTrigger,
} from "@rectangular-labs/ui/components/ui/dropdrawer";
import { useLocalStorage } from "@rectangular-labs/ui/hooks/use-local-storage";

type ViewMode = "tree" | "list";

export const useTreeListMode = () =>
  useLocalStorage<ViewMode>("treeListMode", "tree");

export function TreeListDropDrawer({
  value,
  onChange,
  className,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}) {
  const ActiveIcon = value === "tree" ? Icons.ListTree : Icons.List;

  return (
    <DropDrawer>
      <DropDrawerTrigger asChild>
        <Button
          aria-label={`${value === "tree" ? "Tree" : "List"} view`}
          className={className}
          size="icon-xs"
          title={`${value === "tree" ? "Tree" : "List"} view`}
          variant="ghost"
        >
          <ActiveIcon className="size-4" />
        </Button>
      </DropDrawerTrigger>
      <DropDrawerContent>
        <DropDrawerItem
          onClick={() => onChange("tree")}
          onSelect={() => onChange("tree")}
        >
          <Icons.ListTree className="size-4" />
          <span>Tree view</span>
        </DropDrawerItem>
        <DropDrawerItem
          onClick={() => onChange("list")}
          onSelect={() => onChange("list")}
        >
          <Icons.List className="size-4" />
          <span>List view</span>
        </DropDrawerItem>
      </DropDrawerContent>
    </DropDrawer>
  );
}
