import { CarCard } from '@/components/CarCard'
import { CarCardSkeleton } from '@/components/CarCardSkeleton'
import { Button } from '@/components/ui/button'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

interface CarListing {
  id: string; brand: string; model: string; subModel: string | null; year: number
  currentPrice: number; images: string[]; fuel: string | null; km: number
  city: string | null; bodyType: string | null; condition: string
  auctionEndDate: string; _count: { bids: number }
  owner: { name: string | null; role?: string }
  latitude: number | null; longitude: number | null
}

interface Props {
  cars: CarListing[] | undefined
  loading: boolean
  hasFilters: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onClearFilters: () => void
}

export function CarGrid({ cars, loading, hasFilters, page, totalPages, onPageChange, onClearFilters }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)}
      </div>
    )
  }

  if (!cars || cars.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground rounded-xl border">
        <p className="text-lg font-medium">No cars found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters} className="mt-4">Clear filters</Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cars.map((car, i) => (
          <CarCard key={car.id} {...car} bidCount={car._count.bids} priority={i < 3} ownerRole={car.owner.role} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => onPageChange(Math.max(1, page - 1))} className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                acc.push(p); return acc
              }, [])
              .map((p, i) => p === '...' ? (
                <PaginationItem key={`e${i}`}><PaginationEllipsis /></PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink isActive={p === page} onClick={() => onPageChange(p as number)} className="cursor-pointer">{p}</PaginationLink>
                </PaginationItem>
              ))}
            <PaginationItem>
              <PaginationNext onClick={() => onPageChange(Math.min(totalPages, page + 1))} className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
