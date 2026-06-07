'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
} from 'recharts'

interface AnalyticsData {
  listingPerformance: { label: string; bids: number; currentPrice: number; reservePrice: number }[]
  sellThroughRate:    number
  avgBidsPerListing:  number
  totalRevenue:       number
  totalListings:      number
  soldListings:       number
  winRate:            number
  totalBidCount:      number
  wonBids:            number
  activeProxies:      number
  bidBreakdown:       { status: string; count: number; fill: string }[]
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 text-center">
        <p className="text-2xl font-bold text-primary">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  )
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(i => <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />)}
      </div>
    </div>
  )
}

export function AnalyticsTab({ isBusiness }: { isBusiness: boolean }) {
  const [data,    setData]    = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/analytics')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />
  if (!data)   return null

  const hasBids     = data.bidBreakdown.length > 0
  const hasListings = data.listingPerformance.length > 0
  const hasReserve  = data.listingPerformance.some(l => l.reservePrice > 0)
  const isEmpty     = !hasBids && !hasListings

  return (
    <div className="space-y-6">
      {isBusiness ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="Listings"          value={data.totalListings} />
          <KpiCard label="Sold"              value={data.soldListings} />
          <KpiCard label="Sell-through"      value={`${data.sellThroughRate}%`} />
          <KpiCard label="Avg bids/listing"  value={data.avgBidsPerListing} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="Auctions bid on"  value={data.totalBidCount} />
          <KpiCard label="Won"              value={data.wonBids} />
          <KpiCard label="Win rate"         value={`${data.winRate}%`} />
          <KpiCard label="Active proxy bids" value={data.activeProxies} />
        </div>
      )}

      {isEmpty ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No activity yet — place some bids or list a car to see your analytics.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isBusiness && hasListings && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bids per Listing</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ bids: { label: 'Bids', color: 'hsl(var(--primary))' } }}>
                  <BarChart data={data.listingPerformance.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={96} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="bids" fill="var(--color-bids)" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {hasBids && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">My Bids by Status</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <ChartContainer
                  config={Object.fromEntries(
                    data.bidBreakdown.map(b => [b.status, { label: b.status, color: b.fill }])
                  )}
                  className="flex-1 aspect-square max-h-48"
                >
                  <PieChart>
                    <Pie
                      data={data.bidBreakdown} dataKey="count" nameKey="status"
                      cx="50%" cy="50%" innerRadius="45%" outerRadius="75%"
                    >
                      {data.bidBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                  </PieChart>
                </ChartContainer>
                <div className="shrink-0 space-y-2 text-xs">
                  {data.bidBreakdown.map(b => (
                    <div key={b.status} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: b.fill }} />
                      <span className="text-muted-foreground">{b.status}</span>
                      <span className="font-semibold tabular-nums ml-auto pl-3">{b.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isBusiness && hasReserve && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sale Price vs Reserve</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  currentPrice: { label: 'Sale price', color: 'hsl(var(--primary))' },
                  reservePrice: { label: 'Reserve',    color: '#94a3b8' },
                }}>
                  <BarChart data={data.listingPerformance.filter(l => l.reservePrice > 0).slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                    <YAxis
                      tick={{ fontSize: 10 }} width={44}
                      tickFormatter={v => `${Math.round(Number(v) / 1000)}k`}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent
                        formatter={(v, name) => [`${Number(v).toLocaleString('da-DK')} kr`, name]}
                      />}
                    />
                    <Bar dataKey="currentPrice" fill="var(--color-currentPrice)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="reservePrice" fill="var(--color-reservePrice)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {isBusiness && hasListings && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue from Sales</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-40">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">
                    {data.totalRevenue.toLocaleString('da-DK')} kr
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    across {data.soldListings} sold {data.soldListings === 1 ? 'car' : 'cars'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
