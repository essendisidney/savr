export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 w-full rounded-card bg-gradient-to-r from-savr-fog via-white to-savr-fog"
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="page-band min-h-[70vh] pb-4">
      <div className="h-28 animate-pulse bg-savr-fog/80" />
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <LoadingBlock rows={4} />
      </div>
    </div>
  );
}
