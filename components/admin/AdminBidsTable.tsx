import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy } from 'lucide-react'

interface Bid {
  id: string
  amount: number
  createdAt: string
  bidder: {
    id?: string
    name: string | null
    email?: string
    _count?: { bids: number; cars: number }
  }
}

interface Props { bids: Bid[] }

export function AdminBidsTable({ bids }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">All Bids ({bids.length})</CardTitle></CardHeader>
      {bids.length === 0 ? (
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
              {bids.map((bid, index) => (
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
  )
}
