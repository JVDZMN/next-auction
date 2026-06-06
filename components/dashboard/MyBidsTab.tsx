'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface BidEntry {
  id: string; amount: number; createdAt: string
  car: { id: string; brand: string; model: string; year: number; status: string; currentPrice: number; auctionEndDate: string }
}

const statusVariant: Record<string, string> = {
  active:          'bg-green-100 text-green-800 border-green-200',
  completed:       'bg-blue-100 text-blue-800 border-blue-200',
  reserve_not_met: 'bg-amber-100 text-amber-800 border-amber-200',
  cancelled:       'bg-red-100 text-red-800 border-red-200',
}

interface Props {
  bids: BidEntry[]
  outbidCarIds: string[]
  locale: string
  onOutbidRead: (carId: string) => void
}

export function MyBidsTab({ bids, outbidCarIds, locale, onOutbidRead }: Props) {
  const router = useRouter()

  if (bids.length === 0) return <p className="text-muted-foreground text-sm">No bids placed yet.</p>

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Car</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Your Bid</TableHead>
            <TableHead className="text-right">Current</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bids.map(bid => {
            const isOutbid = outbidCarIds.includes(bid.car.id)
            return (
              <TableRow
                key={bid.id}
                className={cn('cursor-pointer hover:bg-muted/50', isOutbid && 'bg-red-50 hover:bg-red-100/60')}
                onClick={() => { if (isOutbid) onOutbidRead(bid.car.id); router.push(`/${locale}/cars/${bid.car.id}`) }}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {bid.car.year} {bid.car.brand} {bid.car.model}
                    {isOutbid && (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 border border-red-300 animate-pulse">
                        Outbid — click to re-bid
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusVariant[bid.car.status] ?? ''}>{bid.car.status}</Badge>
                </TableCell>
                <TableCell className={cn('text-right font-semibold', isOutbid ? 'text-red-600 line-through' : 'text-primary')}>
                  {bid.amount.toLocaleString('da-DK')} kr
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {bid.car.currentPrice.toLocaleString('da-DK')} kr
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
