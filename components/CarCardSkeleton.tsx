// No 'use client' needed — pure markup, no state.

export function CarCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
      {/* Image area — matches aspect-4/3 from CarCard */}
      <div className="aspect-[4/3] bg-stone-100 animate-pulse" />

      <div className="p-4 space-y-3">
        {/* Title + condition badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="h-4 bg-stone-100 rounded animate-pulse w-2/3" />
          <div className="h-4 bg-stone-100 rounded animate-pulse w-12 shrink-0" />
        </div>

        {/* km · city */}
        <div className="h-3 bg-stone-100 rounded animate-pulse w-1/2" />

        {/* Price row */}
        <div className="border-t border-stone-50 pt-3 flex items-end justify-between">
          <div className="space-y-1.5">
            <div className="h-2.5 bg-stone-100 rounded animate-pulse w-16" />
            <div className="h-5 bg-stone-100 rounded animate-pulse w-28" />
          </div>
          <div className="h-3 bg-stone-100 rounded animate-pulse w-10" />
        </div>
      </div>
    </div>
  )
}
