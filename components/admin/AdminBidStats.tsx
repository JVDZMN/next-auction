import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BidStats {
  totalBids: number
  uniqueBidders: number
  highestBid: number | null
  lowestBid: number | null
  averageBid: number | null
}

interface Props { bidStats: BidStats }

export function AdminBidStats({ bidStats }: Props) {
  const stats = [
    { label: 'Total Bids',     value: String(bidStats.totalBids) },
    { label: 'Unique Bidders', value: String(bidStats.uniqueBidders) },
    ...(bidStats.highestBid != null ? [{ label: 'Highest Bid', value: `${bidStats.highestBid.toLocaleString('da-DK')} kr` }] : []),
    ...(bidStats.lowestBid  != null ? [{ label: 'Lowest Bid',  value: `${bidStats.lowestBid.toLocaleString('da-DK')} kr`  }] : []),
    ...(bidStats.averageBid != null ? [{ label: 'Average Bid', value: `${bidStats.averageBid.toLocaleString('da-DK', { maximumFractionDigits: 0 })} kr` }] : []),
  ]

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Bid Statistics</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map(({ label, value }) => (
            <div key={label} className="text-center p-3 rounded-lg bg-muted/40">
              <p className="text-2xl font-bold text-primary">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
