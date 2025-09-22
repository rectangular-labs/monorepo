"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type ComboboxData = {
  label: string;
  value: string;
};

type ComboboxContextType = {
  data: ComboboxData[];
  type: string;
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  width: number;
  setWidth: (width: number) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
};

const ComboboxContext = createContext<ComboboxContextType>({
  data: [],
  type: "item",
  value: "",
  onValueChange: () => {
    // do nothing
  },
  open: false,
  onOpenChange: () => {
    // do nothing
  },
  width: 200,
  setWidth: () => {
    // do nothing
  },
  inputValue: "",
  setInputValue: () => {
    // do nothing
  },
});

export type ComboboxProps = ComponentProps<typeof Popover> & {
  data: ComboboxData[];
  type: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  input?: string;
  onInputChange?: (value: string) => void;
};

export const Combobox = ({
  data,
  type,
  defaultValue,
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  input: controlledInput,
  onInputChange: controlledOnInputChange,
  ...props
}: ComboboxProps) => {
  const [value, onValueChange] = useControllableState({
    defaultProp: defaultValue ?? "",
    ...(typeof controlledValue === "string" ? { prop: controlledValue } : {}),
    ...(controlledOnValueChange ? { onChange: controlledOnValueChange } : {}),
  });
  const [open, onOpenChange] = useControllableState({
    defaultProp: defaultOpen,
    ...(typeof controlledOpen === "boolean" ? { prop: controlledOpen } : {}),
    ...(controlledOnOpenChange ? { onChange: controlledOnOpenChange } : {}),
  });
  const [input, onInputChange] = useControllableState({
    defaultProp: controlledInput ?? "",
    ...(typeof controlledInput === "string" ? { prop: controlledInput } : {}),
    ...(controlledOnInputChange ? { onChange: controlledOnInputChange } : {}),
  });
  const [width, setWidth] = useState(200);

  return (
    <ComboboxContext.Provider
      value={{
        type,
        value,
        onValueChange,
        open,
        onOpenChange,
        data,
        width,
        setWidth,
        inputValue: input,
        setInputValue: onInputChange,
      }}
    >
      <Popover {...props} onOpenChange={onOpenChange} open={open} />
    </ComboboxContext.Provider>
  );
};

export type ComboboxTriggerProps = ComponentProps<typeof Button>;

export const ComboboxTrigger = ({
  children,
  ...props
}: ComboboxTriggerProps) => {
  const { value, data, type, setWidth } = useContext(ComboboxContext);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Create a ResizeObserver to detect width changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = (entry.target as HTMLElement).offsetWidth;
        if (newWidth) {
          setWidth?.(newWidth);
        }
      }
    });

    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    // Clean up the observer when component unmounts
    return () => {
      resizeObserver.disconnect();
    };
  }, [setWidth]);

  return (
    <PopoverTrigger asChild>
      <Button variant="outline" {...props} ref={ref}>
        {children ?? (
          <span className="flex w-full items-center justify-between gap-2">
            {value
              ? data.find((item) => item.value === value)?.label
              : `Select ${type}...`}
            <ChevronsUpDownIcon
              className="shrink-0 text-muted-foreground"
              size={16}
            />
          </span>
        )}
      </Button>
    </PopoverTrigger>
  );
};

export type ComboboxContentProps = ComponentProps<typeof Command> & {
  popoverOptions?: ComponentProps<typeof PopoverContent>;
};

export const ComboboxContent = ({
  className,
  popoverOptions,
  ...props
}: ComboboxContentProps) => {
  const { width } = useContext(ComboboxContext);

  return (
    <PopoverContent
      className={cn("p-0", className)}
      style={{ width }}
      {...popoverOptions}
    >
      <Command {...props} />
    </PopoverContent>
  );
};

export type ComboboxInputProps = ComponentProps<typeof CommandInput> & {
  value?: string;
};

export const ComboboxInput = ({
  value: controlledValue,
  ...props
}: ComboboxInputProps) => {
  const { type, inputValue, setInputValue } = useContext(ComboboxContext);

  return (
    <CommandInput
      onValueChange={setInputValue}
      placeholder={`Search ${type}...`}
      value={inputValue}
      {...props}
    />
  );
};

export type ComboboxListProps = ComponentProps<typeof CommandList>;

export const ComboboxList = (props: ComboboxListProps) => (
  <CommandList {...props} />
);

export type ComboboxEmptyProps = ComponentProps<typeof CommandEmpty>;

export const ComboboxEmpty = ({ children, ...props }: ComboboxEmptyProps) => {
  const { type } = useContext(ComboboxContext);

  return (
    <CommandEmpty {...props}>{children ?? `No ${type} found.`}</CommandEmpty>
  );
};

export type ComboboxGroupProps = ComponentProps<typeof CommandGroup>;

export const ComboboxGroup = (props: ComboboxGroupProps) => (
  <CommandGroup {...props} />
);

export type ComboboxItemProps = ComponentProps<typeof CommandItem>;

export const ComboboxItem = (props: ComboboxItemProps) => {
  const { onValueChange, onOpenChange } = useContext(ComboboxContext);

  return (
    <CommandItem
      onSelect={(currentValue) => {
        onValueChange(currentValue);
        onOpenChange(false);
      }}
      {...props}
    />
  );
};

export type ComboboxSeparatorProps = ComponentProps<typeof CommandSeparator>;

export const ComboboxSeparator = (props: ComboboxSeparatorProps) => (
  <CommandSeparator {...props} />
);

export type ComboboxCreateNewProps = {
  onCreateNew: (value: string) => void;
  children?: (inputValue: string) => ReactNode;
  className?: string;
};

export const ComboboxCreateNew = ({
  onCreateNew,
  children,
  className,
}: ComboboxCreateNewProps) => {
  const { inputValue, type, onValueChange, onOpenChange } =
    useContext(ComboboxContext);

  const handleCreateNew = () => {
    onCreateNew(inputValue.trim());
    onValueChange(inputValue.trim());
    onOpenChange(false);
  };

  return (
    <button
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent focus:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      onClick={handleCreateNew}
      type="button"
    >
      {children ? (
        children(inputValue)
      ) : (
        <>
          <PlusIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          {inputValue.trim() ? (
            <span className="text-start">{`Create new ${type}: "${inputValue}"`}</span>
          ) : (
            <span>{`Create new ${type}`}</span>
          )}
        </>
      )}
    </button>
  );
};
