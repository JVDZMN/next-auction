import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const roleVariant: Record<string, string> = {
  Admin: 'bg-purple-100 text-purple-800 border-purple-200',
}

interface Stats {
  totalUsers: number; totalCars: number; activeCars: number; totalBids: number
  adminCount: number; sellerCount: number; bidderCount: number
}
interface User  { id: string; name: string | null; email: string; role: string }
interface TopBidder { id: string; name: string | null; totalBids?: number; totalBidAmount?: number }

interface Props {
  stats: Stats
  recentUsers: User[]
  topBidders: TopBidder[]
}

export function OverviewTab({ stats, recentUsers, topBidders }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Users',     value: stats.totalUsers  },
          { title: 'Total Cars',      value: stats.totalCars   },
          { title: 'Active Auctions', value: stats.activeCars  },
          { title: 'Total Bids',      value: stats.totalBids   },
          { title: 'Admins',          value: stats.adminCount  },
          { title: 'Sellers',         value: stats.sellerCount },
          { title: 'Bidders',         value: stats.bidderCount },
        ].map(({ title, value }) => (
          <Card key={title}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-primary">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Users</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentUsers.slice(0, 8).map(user => (
              <div key={user.id} className="flex justify-between items-center p-2 rounded-md bg-muted/40">
                <div>
                  <p className="font-medium text-sm">{user.name || 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant="outline" className={roleVariant[user.role] ?? ''}>{user.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Bidders</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {topBidders.map((bidder, i) => (
              <div key={bidder.id} className="flex justify-between items-center p-2 rounded-md bg-muted/40">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>
                  <div>
                    <p className="font-medium text-sm">{bidder.name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{bidder.totalBids} bids</p>
                  </div>
                </div>
                <p className="font-semibold text-sm text-primary">{bidder.totalBidAmount?.toLocaleString('da-DK')} kr</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
