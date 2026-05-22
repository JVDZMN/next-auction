import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function CarCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-12 shrink-0" />
        </div>
        <Skeleton className="h-3 w-1/2" />
        <div className="border-t pt-3 flex items-end justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
      </CardContent>
    </Card>
  )
}
