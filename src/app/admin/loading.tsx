export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-7 w-48 rounded-lg bg-dark-200 dark:bg-dark-700" />
          <div className="mt-2 h-4 w-32 rounded bg-dark-100 dark:bg-dark-700" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-dark-200 dark:bg-dark-700" />
      </div>

      {/* Stats cards skeleton */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-dark-100 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-dark-100 dark:bg-dark-700" />
              <div>
                <div className="h-3 w-20 rounded bg-dark-100 dark:bg-dark-700" />
                <div className="mt-2 h-6 w-28 rounded bg-dark-200 dark:bg-dark-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800">
        <div className="border-b border-dark-100 px-5 py-4 dark:border-dark-700">
          <div className="h-5 w-36 rounded bg-dark-200 dark:bg-dark-700" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-dark-50 px-5 py-4 dark:border-dark-700">
            <div className="h-4 w-24 rounded bg-dark-100 dark:bg-dark-700" />
            <div className="h-4 w-40 rounded bg-dark-100 dark:bg-dark-700" />
            <div className="h-4 w-16 rounded bg-dark-100 dark:bg-dark-700" />
            <div className="ml-auto h-4 w-20 rounded bg-dark-100 dark:bg-dark-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
