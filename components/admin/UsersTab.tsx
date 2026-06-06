'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ShieldCheck, ShieldOff, UserCog, CheckCircle, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  id: string; name: string | null; email: string; role: string
  sellerVerified: boolean; createdAt: string
  _count?: { cars: number; bids: number }
}

const roleVariant: Record<string, string> = {
  Admin: 'bg-purple-100 text-purple-800 border-purple-200',
}

interface Props {
  users: User[]
  currentUserId?: string
  actionLoading: string | null
  onToggleRole:   (user: User) => void
  onToggleVerify: (user: User) => void
}

export function UsersTab({ users, currentUserId, actionLoading, onToggleRole, onToggleVerify }: Props) {
  const [search, setSearch] = useState('')

  const filtered = search
    ? users.filter(u => {
        const q = search.toLowerCase()
        return u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
      })
    : users

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, email or role…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="text-right">Cars · Bids</TableHead>
                <TableHead className="text-right">Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{user.name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(roleVariant[user.role] ?? '', 'text-xs')}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.sellerVerified
                      ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs gap-1"><CheckCircle className="h-3 w-3" /> Verified</Badge>
                      : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {user._count?.cars ?? 0} · {user._count?.bids ?? 0}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('da-DK')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className={cn('h-7 w-7', user.role === 'ADMIN' ? 'text-purple-600' : 'text-muted-foreground')}
                        disabled={!!actionLoading || user.id === currentUserId}
                        onClick={() => onToggleRole(user)}
                        title={user.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}>
                        <UserCog className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className={cn('h-7 w-7', user.sellerVerified ? 'text-green-600' : 'text-muted-foreground')}
                        disabled={!!actionLoading}
                        onClick={() => onToggleVerify(user)}
                        title={user.sellerVerified ? 'Unverify Seller' : 'Verify Seller'}>
                        {user.sellerVerified ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
