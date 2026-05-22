'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingPage, ErrorPage, PageLayout } from '@/components/PageLayout'
import { useLocale } from '@/lib/i18n/context'
import type { Car } from '@/types/car'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Trophy } from 'lucide-react'

interface AdminCar extends Omit<Car, 'bids'> {
  bids: Array<{
    id: string
    amount: number
    createdAt: string
    bidder: {
      id?: string
      name: string | null
      email?: string
      _count?: { bids: number; cars: number }
    }
  }>
}

interface BidStats {
  totalBids: number
  uniqueBidders: number
  highestBid: number | null
  lowestBid: number | null
  averageBid: number | null
}

const statusVariant: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  reserve_not_met: 'bg-amber-100 text-amber-800 border-amber-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

export default function AdminCarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const locale = useLocale()
  const { id } = use(params)
  const [data, setData] = useState<{ car: AdminCar; bidStats: BidStats } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/cars/${id}`)
      if (response.status === 403) { setError('Access denied. Admin privileges required.'); return }
      if (!response.ok) throw new Error('Failed to fetch data')
      setData(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingPage />
  if (error || !data) return <ErrorPage message={error || 'Failed to load car details'} />

  const { car, bidStats } = data
  const auctionEnded = new Date(car.auctionEndDate) < new Date()

  return (
    <PageLayout>
      <Button variant="ghost" className="mb-4 gap-2" onClick={() => router.push(`/${locale}/admin/dashboard`)}>
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold">{car.year} {car.brand} {car.model}</h1>
                <p className="text-xs text-muted-foreground mt-1">ID: {car.id}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className={statusVariant[car.status] ?? ''}>{car.status.toUpperCase()}</Badge>
                <Badge variant="secondary">{auctionEnded ? 'Auction Ended' : 'Active Auction'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        {car.images.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {car.images.map((image, index) => (
                  <img key={index} src={image} alt={`${car.brand} ${car.model} ${index + 1}`} className="w-full h-48 object-cover rounded-md" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price cards */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: 'Starting Price', value: `${car.startingPrice.toLocaleString('da-DK')} kr`, accent: false },
            { label: 'Current Price',  value: `${car.currentPrice.toLocaleString('da-DK')} kr`,  accent: true },
            ...(car.reservePrice ? [{ label: 'Reserve Price', value: `${car.reservePrice.toLocaleString('da-DK')} kr`, accent: false }] : []),
            { label: 'Auction Ends',   value: new Date(car.auctionEndDate).toLocaleString('da-DK'), accent: false },
          ].map(({ label, value, accent }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`font-bold mt-0.5 ${accent ? 'text-primary' : ''}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bid statistics */}
        <Card>
          <CardHeader><CardTitle className="text-base">Bid Statistics</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Bids',     value: String(bidStats.totalBids) },
                { label: 'Unique Bidders', value: String(bidStats.uniqueBidders) },
                ...(bidStats.highestBid != null ? [{ label: 'Highest Bid', value: `${bidStats.highestBid.toLocaleString('da-DK')} kr` }] : []),
                ...(bidStats.lowestBid  != null ? [{ label: 'Lowest Bid',  value: `${bidStats.lowestBid.toLocaleString('da-DK')} kr`  }] : []),
                ...(bidStats.averageBid != null ? [{ label: 'Average Bid', value: `${bidStats.averageBid.toLocaleString('da-DK', { maximumFractionDigits: 0 })} kr` }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3 rounded-lg bg-muted/40">
                  <p className="text-2xl font-bold text-primary">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Owner */}
        <Card>
          <CardHeader><CardTitle className="text-base">Owner Information</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold">{car.owner.name || 'Anonymous'}</p>
            <p className="text-muted-foreground text-sm">{car.owner.email}</p>
            {car.owner.createdAt && (
              <p className="text-xs text-muted-foreground mt-1">Member since {new Date(car.owner.createdAt).toLocaleDateString()}</p>
            )}
          </CardContent>
        </Card>

        {/* Bids table */}
        <Card>
          <CardHeader><CardTitle className="text-base">All Bids ({car.bids.length})</CardTitle></CardHeader>
          {car.bids.length === 0 ? (
            <CardContent><p className="text-muted-foreground text-sm text-center py-8">No bids yet</p></CardContent>
          ) : (
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Bidder</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {car.bids.map((bid, index) => (
                    <TableRow key={bid.id} className={index === 0 ? 'bg-green-50/50' : ''}>
                      <TableCell>
                        {index === 0
                          ? <Trophy className="h-4 w-4 text-green-600" />
                          : <span className="text-muted-foreground text-xs">#{index + 1}</span>}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{bid.bidder.name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">{bid.bidder.email}</p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {bid.bidder._count?.cars ?? 0} listings · {bid.bidder._count?.bids ?? 0} bids
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(bid.createdAt).toLocaleString('da-DK')}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {bid.amount.toLocaleString('da-DK')} kr
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>

        {/* Specs */}
        <Card>
          <CardHeader><CardTitle className="text-base">Specifications</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Year',       value: String(car.year) },
                { label: 'Kilometers', value: `${car.km.toLocaleString('da-DK')} km` },
                { label: 'Power',      value: `${car.power} HP` },
                { label: 'Condition',  value: car.condition },
                { label: 'Fuel Type',  value: car.fuel },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-semibold capitalize text-sm">{value}</p>
                </div>
              ))}
            </div>

            {car.description && (
              <>
                <Separator className="my-4" />
                <h3 className="font-semibold text-sm mb-1">Description</h3>
                <p className="text-muted-foreground text-sm whitespace-pre-line">{car.description}</p>
              </>
            )}
            {car.specs && (
              <>
                <Separator className="my-4" />
                <h3 className="font-semibold text-sm mb-1">Additional Notes</h3>
                <p className="text-muted-foreground text-sm whitespace-pre-line">{car.specs}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
