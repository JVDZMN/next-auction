import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'

interface BidEntry {
  id: string; amount: number; createdAt: string | Date
  bidder: { name: string | null; email: string }
}

interface Props {
  bids: BidEntry[]
  isLoading: boolean
  labels: { title: string; empty: string; bidder: string; amount: string; time: string; leading: string }
}

export function BidHistoryTable({ bids, isLoading, labels }: Props) {
  return (
    <div className="rounded-xl border p-5 space-y-3">
      <h3 className="font-semibold">{labels.title}</h3>
      <Separator />
      {isLoading ? (
        <div className="flex justify-center py-6"><Spinner className="h-5 w-5" /></div>
      ) : bids.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{labels.empty}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{labels.bidder}</TableHead>
              <TableHead>{labels.amount}</TableHead>
              <TableHead className="text-right">{labels.time}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bids.map((bid, i) => (
              <TableRow key={bid.id} className={i === 0 ? 'bg-emerald-50' : undefined}>
                <TableCell className="font-medium">
                  {bid.bidder.name ?? 'Anonym'}
                  {i === 0 && (
                    <Badge className="ml-2 bg-emerald-700 text-white text-[10px] h-4">{labels.leading}</Badge>
                  )}
                </TableCell>
                <TableCell className="font-semibold">{bid.amount.toLocaleString('da-DK')} kr</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {new Date(bid.createdAt as unknown as string).toLocaleString('da-DK')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
