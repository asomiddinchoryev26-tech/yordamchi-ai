/**
 * PageLoader — Suspense fallback for lazy-loaded routes.
 * On-brand, prevents white-screen flash while a page chunk loads.
 * Lightweight (ships in the main bundle) — no heavy imports.
 */

interface PageLoaderProps {
  label?: string
}

export default function PageLoader({ label }: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex-1 w-full min-h-[55vh] flex flex-col items-center justify-center gap-4 py-16"
    >
      <span className="relative flex h-11 w-11">
        <span className="absolute inline-flex h-full w-full rounded-full bg-brand/20 animate-ping" />
        <span className="relative inline-flex h-11 w-11 rounded-full border-[3px] border-brand/25 border-t-brand animate-spin-fast" />
      </span>
      {label && (
        <p className="text-sm font-medium text-gray-400 dark:text-gray-500">{label}</p>
      )}
      <span className="sr-only">Yuklanmoqda…</span>
    </div>
  )
}
