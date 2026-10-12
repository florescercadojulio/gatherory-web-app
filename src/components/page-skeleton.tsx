import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div
      className="min-h-svh bg-background"
      role="status"
      aria-busy="true"
      aria-label="Loading page"
    >
      <span className="sr-only">Loading…</span>
      <header className="app-toolbar">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="h-4 w-28" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="hidden h-8 w-24 rounded-md sm:block" />
        </div>
      </header>
      <main className="app-page-shell">
        <section className="space-y-3">
          <Skeleton className="h-9 w-56 max-w-2/3" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </section>
        <Skeleton className="h-56 w-full rounded-2xl" />
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-lg" />
          ))}
        </section>
        <section className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </section>
      </main>
    </div>
  );
}
