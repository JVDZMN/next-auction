'use client'

import { Fragment, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'

interface UserCar {
  id: string; brand: string; model: string; year: number; status: string
  isDraft: boolean; currentPrice: number; auctionEndDate: string
  createdAt: string; views: number; _count: { bids: number }
}
interface BidEntry {
  id: string; amount: number; createdAt: string
  bidder: { id: string; name: string | null; email: string }
}

const statusVariant: Record<string, string> = {
  active:          'bg-green-100 text-green-800 border-green-200',
  completed:       'bg-blue-100 text-blue-800 border-blue-200',
  reserve_not_met: 'bg-amber-100 text-amber-800 border-amber-200',
  cancelled:       'bg-red-100 text-red-800 border-red-200',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function BidAuditPanel({ car, bids, loading, locale }: {
  car: UserCar; bids: BidEntry[] | undefined; loading: boolean; locale: string
}) {
  return (
    <div className="p-4 border-t bg-muted/20 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Bid History — {car.year} {car.brand} {car.model}</p>
        <Link href={`/${locale}/cars/${car.id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={e => e.stopPropagation()}>
          <ExternalLink className="h-3 w-3" /> View public listing
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
      ) : !bids || bids.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No bids placed yet.</p>
      ) : (
        <div className="rounded-md border overflow-hidden bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Bidder</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bids.map((bid, i) => (
                <TableRow key={bid.id} className={i === 0 ? 'font-medium' : ''}>
                  <TableCell className="py-2 text-sm">
                    <Link href={`/${locale}/dashboard/users/${bid.bidder.id}`} className="text-primary hover:underline" onClick={e => e.stopPropagation()}>
                      {bid.bidder.name || 'Anonymous'}
                    </Link>
                    {i === 0 && (
                      <span className="ml-2 text-[10px] font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-1.5 py-0.5">Leading</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2 text-sm text-right font-mono">{bid.amount.toLocaleString('da-DK')} kr</TableCell>
                  <TableCell className="py-2 text-xs text-right text-muted-foreground">{fmtDate(bid.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

interface Props {
  cars: UserCar[]
  isPrivate: boolean
  isBusiness: boolean
  carsListedThisYear: number
  carsWithNewBids: string[]
  locale: string
  markCarBidsRead: (id: string) => void
  onPublish: (carId: string) => void
}

export function MyAuctionsTab({ cars, isPrivate, isBusiness, carsListedThisYear, carsWithNewBids, locale, markCarBidsRead, onPublish }: Props) {
  const router = useRouter()
  const [expandedCarId, setExpandedCarId] = useState<string | null>(null)
  const [bidsByCarId,   setBidsByCarId]   = useState<Record<string, BidEntry[]>>({})
  const [bidLogLoading, setBidLogLoading] = useState(false)

  function toggleExpand(carId: string) {
    if (expandedCarId === carId) { setExpandedCarId(null); return }
    setExpandedCarId(carId)
    if (carsWithNewBids.includes(carId)) markCarBidsRead(carId)
  }

  useEffect(() => {
    if (!expandedCarId || bidsByCarId[expandedCarId] !== undefined) return
    setBidLogLoading(true)
    fetch(`/api/bids?carId=${expandedCarId}`)
      .then(r => r.json())
      .then(d => setBidsByCarId(prev => ({ ...prev, [expandedCarId]: d.bids ?? [] })))
      .catch(() => setBidsByCarId(prev => ({ ...prev, [expandedCarId]: [] })))
      .finally(() => setBidLogLoading(false))
  }, [expandedCarId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-semibold">
            {isBusiness ? 'Mine annoncer (ubegrænset)' : `Mine biler (${carsListedThisYear}/2 dette år)`}
          </h3>
          {isPrivate && carsListedThisYear >= 2 && (
            <p className="text-xs mt-0.5" style={{ color: 'red' }}>SKAT-grænsen på 2 biler/år er nået.</p>
          )}
        </div>
        <Button size="sm" onClick={() => router.push(`/${locale}/cars/create`)} disabled={isPrivate && carsListedThisYear >= 2}>
          <Plus className="h-4 w-4 mr-1" /> Ny annonce
        </Button>
      </div>

      {cars.length === 0 ? (
        <p className="text-muted-foreground text-sm">No listings yet.</p>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Activity</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map(car => {
                const hasNewBids = carsWithNewBids.includes(car.id)
                const isExpanded = expandedCarId === car.id
                return (
                  <Fragment key={car.id}>
                    <TableRow className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => toggleExpand(car.id)}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {car.year} {car.brand} {car.model}
                          {hasNewBids && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-300 animate-pulse">New bids</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className={statusVariant[car.status] ?? ''}>{car.status}</Badge>
                          {car.isDraft && <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">draft</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{car.currentPrice.toLocaleString('da-DK')} kr</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{car.views} views · {car._count.bids} bids</TableCell>
                      <TableCell className="text-right pr-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={e => { e.stopPropagation(); router.push(`/${locale}/cars/${car.id}`) }}>View</Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={e => { e.stopPropagation(); router.push(`/${locale}/cars/${car.id}/edit`) }}>Edit</Button>
                          {car.isDraft && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                              onClick={e => { e.stopPropagation(); onPublish(car.id) }}>
                              Publish
                            </Button>
                          )}
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5} className="p-0">
                          <BidAuditPanel car={car} bids={bidsByCarId[car.id]} loading={bidLogLoading && !bidsByCarId[car.id]} locale={locale} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
