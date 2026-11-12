import { Search, X } from "lucide-react";
import { cn } from "#/lib/cn.ts";
import { Input } from "./input.tsx";

export interface SearchInputProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
}

export function SearchInput({
  value,
  onValueChange,
  placeholder = "Search…",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fg-subtle" />
      <Input
        type="search"
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
        onKeyDown={(event) => {
          if (event.key === "Escape") onValueChange("");
        }}
      />
      {value !== "" && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onValueChange("")}
          className="absolute top-1/2 right-1.5 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded text-fg-subtle hover:bg-surface-hover hover:text-fg"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
