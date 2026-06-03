// PotluckSkeleton.tsx
// Skeleton loader matching exact PotluckCard dimensions.
// Renders during initial data fetch — prevents layout shift.

export function PotluckSkeleton() {
  return (
    <div
      className="rounded-2xl border border-gray-100 dark:border-neutral-800
                 bg-white dark:bg-neutral-900 p-5 space-y-4
                 animate-pulse"
      aria-hidden="true"
    >
      {/* Top row: status badge + timer */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-neutral-800" />
        <div className="h-5 w-24 rounded-md bg-gray-200 dark:bg-neutral-800" />
      </div>

      {/* Title + price */}
      <div className="space-y-2">
        <div className="h-6 w-40 rounded-md bg-gray-200 dark:bg-neutral-800" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-28 rounded-md bg-gray-200 dark:bg-neutral-800" />
          <div className="h-5 w-20 rounded-md bg-gray-100 dark:bg-neutral-800" />
          <div className="h-6 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-neutral-800" />
        <div className="flex justify-between">
          <div className="h-4 w-24 rounded bg-gray-100 dark:bg-neutral-800" />
          <div className="h-4 w-12 rounded bg-gray-100 dark:bg-neutral-800" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <div className="h-9 flex-1 rounded-xl bg-gray-200 dark:bg-neutral-800" />
        <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-neutral-800" />
        <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
