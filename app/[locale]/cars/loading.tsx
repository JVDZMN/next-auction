import { CarCardSkeleton } from '@/components/CarCardSkeleton'

export default function CarsLoading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="h-16 bg-white border-b border-stone-100" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 shrink-0 space-y-4">
            <div className="h-4 bg-stone-100 rounded animate-pulse w-16" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 bg-stone-100 rounded animate-pulse w-14" />
                <div className="h-9 bg-stone-100 rounded animate-pulse" />
              </div>
            ))}
          </aside>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <CarCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
