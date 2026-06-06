import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle } from 'lucide-react'

interface Seller {
  id: string; name: string | null; email: string; _count?: { cars: number }
}
interface FullUser {
  id: string; name: string | null; email: string; role: string
  sellerVerified: boolean; createdAt: string; _count?: { cars: number; bids: number }
}

interface Props {
  sellers: Seller[]
  allUsers: FullUser[]
  actionLoading: string | null
  onToggleVerify: (user: FullUser) => void
}

export function SellersTab({ sellers, allUsers, actionLoading, onToggleVerify }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Sellers ({sellers.length})</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="text-right">Cars Listed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sellers.map(seller => {
              const full = allUsers.find(u => u.id === seller.id)
              return (
                <TableRow key={seller.id}>
                  <TableCell className="font-medium">{seller.name || 'Anonymous'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{seller.email}</TableCell>
                  <TableCell>
                    {full?.sellerVerified
                      ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs gap-1"><CheckCircle className="h-3 w-3" /> Verified</Badge>
                      : <span className="text-xs text-muted-foreground">Unverified</span>}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{seller._count?.cars ?? 0}</TableCell>
                  <TableCell className="text-right">
                    {full && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!!actionLoading} onClick={() => onToggleVerify(full)}>
                        {full.sellerVerified ? 'Unverify' : 'Verify'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
