import { Card } from "#/components/ui/card.tsx";
import { Skeleton } from "#/components/ui/feedback.tsx";

export function DetailSkeleton() {
  return (
    <div aria-busy aria-label="Loading">
      <div className="mb-6 flex items-center gap-3.5">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-32" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="flex flex-col gap-3 p-4">
          {[60, 80, 50, 70].map((w) => (
            <Skeleton key={w} className="h-3.5" style={{ width: `${w}%` }} />
          ))}
        </Card>
        <Card className="h-64" />
      </div>
    </div>
  );
}
