import { Skeleton } from "#/components/ui/feedback.tsx";

export function TableSkeleton({ rows = 5 }: { readonly rows?: number }) {
  return (
    <div aria-busy aria-label="Loading" className="flex flex-col">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex h-12 items-center gap-3 border-b border-border px-4 last:border-b-0"
        >
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="ml-auto h-3.5 w-24" />
        </div>
      ))}
    </div>
  );
}
