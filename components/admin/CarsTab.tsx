'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, XCircle, Trash2 } from 'lucide-react'

interface Car {
  id: string; brand: string; model: string; year: number
  currentPrice: number; status: string; isDraft: boolean; createdAt: string
  owner: { name: string | null; email: string }
}

const statusVariant: Record<string, string> = {
  active:          'bg-green-100 text-green-800 border-green-200',
  completed:       'bg-blue-100 text-blue-800 border-blue-200',
  reserve_not_met: 'bg-amber-100 text-amber-800 border-amber-200',
  cancelled:       'bg-red-100 text-red-800 border-red-200',
}

interface Props {
  cars: Car[]
  locale: string
  actionLoading: string | null
  onCancel:      (car: Car)    => void
  onDeleteClick: (car: Car)    => void
}

export function CarsTab({ cars, locale, actionLoading, onCancel, onDeleteClick }: Props) {
  const router  = useRouter()
  const [search, setSearch] = useState('')

  const filtered = search
    ? cars.filter(c => {
        const q = search.toLowerCase()
        return `${c.brand} ${c.model} ${c.year}`.toLowerCase().includes(q) ||
          c.owner.name?.toLowerCase().includes(q) ||
          c.owner.email.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q)
      })
    : cars

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by car, seller, or status…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(car => (
                <TableRow key={car.id}>
                  <TableCell className="font-medium cursor-pointer hover:text-primary" onClick={() => router.push(`/${locale}/admin/cars/${car.id}`)}>
                    {car.year} {car.brand} {car.model}
                    {car.isDraft && <Badge variant="outline" className="ml-2 bg-orange-50 text-orange-700 border-orange-200 text-xs">draft</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{car.owner.name || car.owner.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusVariant[car.status] ?? ''}>{car.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{car.currentPrice.toLocaleString('da-DK')} kr</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {car.status === 'active' && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-amber-600 hover:text-amber-700"
                          disabled={actionLoading === `cancel-${car.id}`}
                          onClick={() => onCancel(car)} title="Force cancel">
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {car.status !== 'active' && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                          disabled={actionLoading === `delete-${car.id}`}
                          onClick={() => onDeleteClick(car)} title="Delete listing">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No cars found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
