'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { LoadingPage, ErrorPage, PageLayout } from '@/components/PageLayout'
import { useLocale } from '@/lib/i18n/context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Search, ShieldCheck, ShieldOff, UserCog, Trash2, XCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers: number; totalCars: number; activeCars: number; totalBids: number
  adminCount: number; sellerCount: number; bidderCount: number
}
interface User {
  id: string; name: string | null; email: string; role: string
  sellerVerified: boolean; createdAt: string
  _count?: { cars: number; bids: number }
  totalBidAmount?: number; totalBids?: number
}
interface Car {
  id: string; brand: string; model: string; year: number
  currentPrice: number; status: string; isDraft: boolean; createdAt: string
  owner: { name: string | null; email: string }
}
interface DashboardData {
  stats: Stats; adminUsers: User[]; sellers: User[]; bidders: User[]
  recentUsers: User[]; recentCars: Car[]; topBidders: User[]
}

// ─── Variant maps ─────────────────────────────────────────────────────────────

const statusVariant: Record<string, string> = {
  active:           'bg-green-100 text-green-800 border-green-200',
  completed:        'bg-blue-100 text-blue-800 border-blue-200',
  reserve_not_met:  'bg-amber-100 text-amber-800 border-amber-200',
  cancelled:        'bg-red-100 text-red-800 border-red-200',
}
const roleVariant: Record<string, string> = {
  Admin: 'bg-purple-100 text-purple-800 border-purple-200',
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const locale = useLocale()

  const [data,          setData]          = useState<DashboardData | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [userSearch,    setUserSearch]    = useState('')
  const [carSearch,     setCarSearch]     = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; label: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push(`/${locale}/auth/signin`); return }
    if (status === 'authenticated')   { void fetchData() }
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchData() {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.status === 403) { setError('Access denied. Admin privileges required.'); return }
      if (!res.ok) throw new Error('Failed to fetch data')
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // ── User actions ─────────────────────────────────────────────────────────

  async function toggleRole(user: User) {
    const newRole = user.role === 'Admin' ? 'User' : 'Admin'
    setActionLoading(`role-${user.id}`)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) {
        const e = await res.json()
        toast.error(e.error ?? 'Failed to update role')
        return
      }
      toast.success(`${user.name || user.email} is now ${newRole}`)
      await fetchData()
    } finally {
      setActionLoading(null)
    }
  }

  async function toggleVerify(user: User) {
    const method = user.sellerVerified ? 'DELETE' : 'POST'
    setActionLoading(`verify-${user.id}`)
    try {
      await fetch(`/api/admin/users/${user.id}/verify-seller`, { method })
      toast.success(user.sellerVerified ? 'Seller verification removed' : 'Seller verified')
      await fetchData()
    } finally {
      setActionLoading(null)
    }
  }

  // ── Car actions ───────────────────────────────────────────────────────────

  async function forceCancelCar(car: Car) {
    setActionLoading(`cancel-${car.id}`)
    try {
      const res = await fetch(`/api/cars/${car.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) { toast.error('Failed to cancel listing'); return }
      toast.success(`${car.year} ${car.brand} ${car.model} cancelled`)
      await fetchData()
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteCar(id: string) {
    setActionLoading(`delete-${id}`)
    try {
      const res = await fetch(`/api/admin/cars/${id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Failed to delete listing'); return }
      toast.success('Listing deleted')
      setConfirmDelete(null)
      await fetchData()
    } finally {
      setActionLoading(null)
    }
  }

  // ── Filtered lists ────────────────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    if (!data || !userSearch) return data?.recentUsers ?? []
    const q = userSearch.toLowerCase()
    return data.recentUsers.filter(u =>
      u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    )
  }, [data, userSearch])

  const filteredCars = useMemo(() => {
    if (!data || !carSearch) return data?.recentCars ?? []
    const q = carSearch.toLowerCase()
    return data.recentCars.filter(c =>
      `${c.brand} ${c.model} ${c.year}`.toLowerCase().includes(q) ||
      c.owner.name?.toLowerCase().includes(q) ||
      c.owner.email.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    )
  }, [data, carSearch])

  if (loading) return <LoadingPage />
  if (error || !data) return <ErrorPage message={error || 'Failed to load dashboard'} />

  return (
    <PageLayout>
      {/* Confirm delete dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={open => { if (!open) setConfirmDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{confirmDelete?.label}</strong> will be permanently deleted along with all bids. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deleteCar(confirmDelete.id)}
              disabled={actionLoading === `delete-${confirmDelete?.id}`}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage users, cars, and monitor auction activity</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">
            Users <Badge variant="secondary" className="ml-1.5">{data.recentUsers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sellers">Sellers</TabsTrigger>
          <TabsTrigger value="bidders">Bidders</TabsTrigger>
          <TabsTrigger value="cars">
            Cars <Badge variant="secondary" className="ml-1.5">{data.recentCars.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'Total Users',     value: data.stats.totalUsers },
              { title: 'Total Cars',      value: data.stats.totalCars },
              { title: 'Active Auctions', value: data.stats.activeCars },
              { title: 'Total Bids',      value: data.stats.totalBids },
              { title: 'Admins',          value: data.stats.adminCount },
              { title: 'Sellers',         value: data.stats.sellerCount },
              { title: 'Bidders',         value: data.stats.bidderCount },
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
                {data.recentUsers.slice(0, 8).map(user => (
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
                {data.topBidders.map((bidder, i) => (
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
        </TabsContent>

        {/* ── Users ── */}
        <TabsContent value="users" className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or role…"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="pl-9"
            />
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
                  {filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{user.name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(roleVariant[user.role] ?? '', 'text-xs')}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.sellerVerified ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs gap-1">
                            <CheckCircle className="h-3 w-3" /> Verified
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {user._count?.cars ?? 0} · {user._count?.bids ?? 0}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('da-DK')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle admin role */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className={cn('h-7 w-7', user.role === 'Admin' ? 'text-purple-600' : 'text-muted-foreground')}
                            disabled={!!actionLoading || user.id === session?.user?.id}
                            onClick={() => toggleRole(user)}
                            title={user.role === 'Admin' ? 'Remove Admin' : 'Make Admin'}
                          >
                            <UserCog className="h-3.5 w-3.5" />
                          </Button>
                          {/* Toggle seller verification */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className={cn('h-7 w-7', user.sellerVerified ? 'text-green-600' : 'text-muted-foreground')}
                            disabled={!!actionLoading}
                            onClick={() => toggleVerify(user)}
                            title={user.sellerVerified ? 'Unverify Seller' : 'Verify Seller'}
                          >
                            {user.sellerVerified
                              ? <ShieldOff className="h-3.5 w-3.5" />
                              : <ShieldCheck className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Sellers ── */}
        <TabsContent value="sellers">
          <Card>
            <CardHeader><CardTitle className="text-base">Sellers ({data.sellers.length})</CardTitle></CardHeader>
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
                  {data.sellers.map(seller => {
                    const full = data.recentUsers.find(u => u.id === seller.id)
                    return (
                      <TableRow key={seller.id}>
                        <TableCell className="font-medium">{seller.name || 'Anonymous'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{seller.email}</TableCell>
                        <TableCell>
                          {full?.sellerVerified ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs gap-1">
                              <CheckCircle className="h-3 w-3" /> Verified
                            </Badge>
                          ) : <span className="text-xs text-muted-foreground">Unverified</span>}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{seller._count?.cars ?? 0}</TableCell>
                        <TableCell className="text-right">
                          {full && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={!!actionLoading}
                              onClick={() => toggleVerify(full)}
                            >
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
        </TabsContent>

        {/* ── Bidders ── */}
        <TabsContent value="bidders">
          <Card>
            <CardHeader><CardTitle className="text-base">Bidders ({data.bidders.length})</CardTitle></CardHeader>
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
                  {data.bidders.map(bidder => (
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
        </TabsContent>

        {/* ── Cars ── */}
        <TabsContent value="cars" className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by car, seller, or status…"
              value={carSearch}
              onChange={e => setCarSearch(e.target.value)}
              className="pl-9"
            />
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
                  {filteredCars.map(car => (
                    <TableRow key={car.id}>
                      <TableCell
                        className="font-medium cursor-pointer hover:text-primary"
                        onClick={() => router.push(`/${locale}/admin/cars/${car.id}`)}
                      >
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
                          {/* Force cancel — only for active listings */}
                          {car.status === 'active' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-amber-600 hover:text-amber-700"
                              disabled={actionLoading === `cancel-${car.id}`}
                              onClick={() => forceCancelCar(car)}
                              title="Force cancel"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {/* Delete — only non-active listings */}
                          {car.status !== 'active' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              disabled={actionLoading === `delete-${car.id}`}
                              onClick={() => setConfirmDelete({ id: car.id, label: `${car.year} ${car.brand} ${car.model}` })}
                              title="Delete listing"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCars.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No cars found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
