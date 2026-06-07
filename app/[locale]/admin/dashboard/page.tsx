'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { LoadingPage, ErrorPage, PageLayout } from '@/components/PageLayout'
import { useLocale } from '@/lib/i18n/context'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { OverviewTab } from '@/components/admin/OverviewTab'
import { UsersTab } from '@/components/admin/UsersTab'
import { SellersTab } from '@/components/admin/SellersTab'
import { BiddersTab } from '@/components/admin/BiddersTab'
import { CarsTab } from '@/components/admin/CarsTab'
import { ChartsTab } from '@/components/admin/ChartsTab'

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

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const locale = useLocale()

  const [data,          setData]          = useState<DashboardData | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
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

  async function toggleRole(user: User) {
    const newRole = user.role === 'ADMIN' ? 'PRIVATE_USER' : 'ADMIN'
    setActionLoading(`role-${user.id}`)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) { toast.error((await res.json()).error ?? 'Failed to update role'); return }
      toast.success(`${user.name || user.email} is now ${newRole}`)
      await fetchData()
    } finally { setActionLoading(null) }
  }

  async function toggleVerify(user: User) {
    const method = user.sellerVerified ? 'DELETE' : 'POST'
    setActionLoading(`verify-${user.id}`)
    try {
      await fetch(`/api/admin/users/${user.id}/verify-seller`, { method })
      toast.success(user.sellerVerified ? 'Seller verification removed' : 'Seller verified')
      await fetchData()
    } finally { setActionLoading(null) }
  }

  async function forceCancelCar(car: Car) {
    setActionLoading(`cancel-${car.id}`)
    try {
      const res = await fetch(`/api/cars/${car.id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) { toast.error('Failed to cancel listing'); return }
      toast.success(`${car.year} ${car.brand} ${car.model} cancelled`)
      await fetchData()
    } finally { setActionLoading(null) }
  }

  async function deleteCar(id: string) {
    setActionLoading(`delete-${id}`)
    try {
      const res = await fetch(`/api/admin/cars/${id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Failed to delete listing'); return }
      toast.success('Listing deleted')
      setConfirmDelete(null)
      await fetchData()
    } finally { setActionLoading(null) }
  }

  if (loading) return <LoadingPage />
  if (error || !data) return <ErrorPage message={error || 'Failed to load dashboard'} />

  return (
    <PageLayout>
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
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="users">
            Users <Badge variant="secondary" className="ml-1.5">{data.recentUsers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sellers">Sellers</TabsTrigger>
          <TabsTrigger value="bidders">Bidders</TabsTrigger>
          <TabsTrigger value="cars">
            Cars <Badge variant="secondary" className="ml-1.5">{data.recentCars.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab stats={data.stats} recentUsers={data.recentUsers} topBidders={data.topBidders} />
        </TabsContent>

        <TabsContent value="charts">
          <ChartsTab />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab
            users={data.recentUsers}
            currentUserId={session?.user?.id}
            actionLoading={actionLoading}
            onToggleRole={toggleRole}
            onToggleVerify={toggleVerify}
          />
        </TabsContent>

        <TabsContent value="sellers">
          <SellersTab
            sellers={data.sellers}
            allUsers={data.recentUsers}
            actionLoading={actionLoading}
            onToggleVerify={toggleVerify}
          />
        </TabsContent>

        <TabsContent value="bidders">
          <BiddersTab bidders={data.bidders} />
        </TabsContent>

        <TabsContent value="cars">
          <CarsTab
            cars={data.recentCars}
            locale={locale}
            actionLoading={actionLoading}
            onCancel={forceCancelCar}
            onDeleteClick={car => setConfirmDelete({ id: car.id, label: `${car.year} ${car.brand} ${car.model}` })}
          />
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
