'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
} from 'recharts'

interface ChartData {
  bidsOverTime:  { date: string; bids: number }[]
  usersOverTime: { week: string; users: number }[]
  auctionStatus: { status: string; count: number }[]
  topBrands:     { brand: string; count: number }[]
  pendingApprovals: number
}

const STATUS_COLORS: Record<string, string> = {
  active:          '#22c55e',
  completed:       '#3b82f6',
  reserve_not_met: '#f59e0b',
  no_bid:          '#94a3b8',
  cancelled:       '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  active:          'Active',
  completed:       'Sold',
  reserve_not_met: 'Reserve not met',
  no_bid:          'No bids',
  cancelled:       'Cancelled',
}

function ChartSkeleton() {
  return <div className="h-64 rounded-xl bg-muted animate-pulse" />
}

export function ChartsTab() {
  const [data,    setData]    = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/charts')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartSkeleton /><ChartSkeleton />
          <ChartSkeleton /><ChartSkeleton />
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {data.pendingApprovals > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Badge className="bg-amber-500 text-white shrink-0">{data.pendingApprovals}</Badge>
          <span className="text-sm font-medium text-amber-800">
            Business {data.pendingApprovals === 1 ? 'user' : 'users'} awaiting CVR approval
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bids — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ bids: { label: 'Bids', color: 'hsl(var(--primary))' } }}>
              <AreaChart data={data.bidsOverTime}>
                <defs>
                  <linearGradient id="bidGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--color-bids)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-bids)" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone" dataKey="bids"
                  stroke="var(--color-bids)" fill="url(#bidGrad)"
                  strokeWidth={2} dot={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Users — Last 12 Weeks</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ users: { label: 'Users', color: '#8b5cf6' } }}>
              <BarChart data={data.usersOverTime}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} interval={1} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="users" fill="var(--color-users)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Auction Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <ChartContainer
              config={Object.fromEntries(
                data.auctionStatus.map(s => [
                  s.status,
                  { label: STATUS_LABELS[s.status] ?? s.status, color: STATUS_COLORS[s.status] ?? '#94a3b8' },
                ])
              )}
              className="flex-1 aspect-square max-h-48"
            >
              <PieChart>
                <Pie
                  data={data.auctionStatus} dataKey="count" nameKey="status"
                  cx="50%" cy="50%" innerRadius="45%" outerRadius="75%"
                >
                  {data.auctionStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
              </PieChart>
            </ChartContainer>
            <div className="shrink-0 space-y-2 text-xs min-w-0">
              {data.auctionStatus.map(s => (
                <div key={s.status} className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[s.status] ?? '#94a3b8' }}
                  />
                  <span className="text-muted-foreground truncate">{STATUS_LABELS[s.status] ?? s.status}</span>
                  <span className="font-semibold tabular-nums ml-auto pl-3">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Brands by Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: 'Listings', color: 'hsl(var(--primary))' } }}>
              <BarChart data={data.topBrands} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="brand" tick={{ fontSize: 10 }} width={60} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
