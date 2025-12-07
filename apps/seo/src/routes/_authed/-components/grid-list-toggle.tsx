import * as Icons from "@rectangular-labs/ui/components/icon";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@rectangular-labs/ui/components/ui/toggle-group";
import { useLocalStorage } from "@rectangular-labs/ui/hooks/use-local-storage";

type ViewMode = "grid" | "list";

export const useGridListMode = () =>
  useLocalStorage<ViewMode>("gridListMode", "grid");

export function GridListToggle({
  value,
  onChange,
  className,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}) {
  return (
    <ToggleGroup
      className={className}
      onValueChange={(val) => val && onChange(val as ViewMode)}
      type="single"
      value={value}
    >
      <ToggleGroupItem aria-label="Grid view" value="grid">
        <Icons.Grid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="List view" value="list">
        <Icons.List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
