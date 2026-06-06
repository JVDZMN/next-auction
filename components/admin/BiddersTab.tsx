import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Bidder { id: string; name: string | null; email: string; _count?: { bids: number } }

export function BiddersTab({ bidders }: { bidders: Bidder[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Bidders ({bidders.length})</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Bids Placed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bidders.map(bidder => (
              <TableRow key={bidder.id}>
                <TableCell className="font-medium">{bidder.name || 'Anonymous'}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{bidder.email}</TableCell>
                <TableCell className="text-right font-semibold">{bidder._count?.bids ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
