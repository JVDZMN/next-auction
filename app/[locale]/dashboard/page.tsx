"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { LoadingPage, ErrorPage, PageLayout } from "@/components/PageLayout"
import { useLocale, useDict } from "@/lib/i18n/context"
import { useNotifications } from "@/lib/notification-context"
import { ProfileCard } from "@/components/dashboard/ProfileCard"
import { StatsGrid } from "@/components/dashboard/StatsGrid"
import { MyAuctionsTab } from "@/components/dashboard/MyAuctionsTab"
import { MyBidsTab } from "@/components/dashboard/MyBidsTab"
import { SavedSearchesTab } from "@/components/dashboard/SavedSearchesTab"
import { MessagesTab } from "@/components/dashboard/MessagesTab"
import { AnalyticsTab } from "@/components/dashboard/AnalyticsTab"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare } from "lucide-react"

interface SavedSearch {
  id: string; label: string | null; brand: string | null; maxPrice: number | null
  minYear: number | null; fuel: string | null; notifyNewListing: boolean; createdAt: string
}
interface UserCar {
  id: string; brand: string; model: string; year: number; status: string
  isDraft: boolean; currentPrice: number; startingPrice: number
  auctionEndDate: string; createdAt: string; views: number; _count: { bids: number }
}
interface User {
  id: string; name: string | null; email: string; image?: string | null
  role: string; createdAt: string
  cars: UserCar[]
  bids: Array<{
    id: string; amount: number; createdAt: string
    car: { id: string; brand: string; model: string; year: number; status: string; currentPrice: number; auctionEndDate: string }
  }>
  savedSearches: SavedSearch[]
}

function DashboardContent() {
  const router       = useRouter()
  const locale       = useLocale()
  const td           = useDict().dashboard
  const searchParams = useSearchParams()
  const {
    unreadMessages, carsWithNewBids, outbidCarIds,
    unreadPerSender, msgUsers,
    markMessagesRead, markCarBidsRead, markAllCarsWithNewBidsRead,
    markOutbidRead, markAllOutbidRead, markSenderRead,
  } = useNotifications()

  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') ?? 'listings')
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/user/dashboard")
      if (!res.ok) throw new Error("Failed to fetch user data")
      setUser((await res.json()).user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUser() }, [fetchUser])

  // Clear notification badges when switching tabs
  useEffect(() => { if (activeTab === 'messages')  markMessagesRead()           }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeTab === 'bids')      markAllOutbidRead()          }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeTab === 'listings')  markAllCarsWithNewBidsRead() }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  function switchTab(tab: string) {
    setActiveTab(tab)
    router.replace(`/${locale}/dashboard?tab=${tab}`, { scroll: false })
  }

  const publishCar = async (carId: string) => {
    const res = await fetch(`/api/cars/${carId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDraft: false }),
    })
    if (res.ok) fetchUser()
  }

  if (loading) return <LoadingPage maxWidth="max-w-5xl" />
  if (error || !user) return <ErrorPage message={error || "Failed to load"} maxWidth="max-w-5xl" />

  if (user.role === 'ADMIN') {
    router.replace(`/${locale}/admin/dashboard`)
    return <LoadingPage maxWidth="max-w-5xl" />
  }

  const isPrivate  = user.role === 'PRIVATE_USER'
  const isBusiness = user.role === 'BUSINESS_USER'
  const thisYear   = new Date().getFullYear()
  const carsListedThisYear = user.cars.filter(c => new Date(c.createdAt).getFullYear() === thisYear).length

  return (
    <PageLayout maxWidth="max-w-5xl">
      <ProfileCard
        name={user.name} email={user.email} image={user.image}
        role={user.role} createdAt={user.createdAt}
        carsListedThisYear={carsListedThisYear}
      />

      {user.cars.length > 0 && (
        <StatsGrid stats={[
          { label: td.activeAuctions, value: user.cars.filter(c => c.status === 'active' && !c.isDraft).length },
          { label: td.totalViews,     value: user.cars.reduce((s, c) => s + c.views, 0) },
          { label: td.bidsReceived,   value: user.cars.reduce((s, c) => s + c._count.bids, 0) },
          { label: td.carsSold,       value: user.cars.filter(c => c.status === 'completed').length },
        ]} />
      )}

      <Tabs value={activeTab} onValueChange={switchTab}>
        <div className="overflow-x-auto dashboard-tabs mb-4">
          <TabsList className="flex w-max min-w-full gap-1 h-auto">
            <TabsTrigger value="listings" className="gap-1.5 shrink-0">
              {td.myAuctions}
              <Badge variant="secondary" className="ml-1">{user.cars.length}</Badge>
              {carsWithNewBids.length > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white tabular-nums animate-pulse">
                  {carsWithNewBids.length}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="bids" className="gap-1.5 shrink-0">
              {td.myBids}
              <Badge variant="secondary" className="ml-1">{user.bids.length}</Badge>
              {outbidCarIds.length > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white tabular-nums animate-pulse">
                  {outbidCarIds.length}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="searches" className="shrink-0">
              {td.savedSearches} <Badge variant="secondary" className="ml-1.5">{user.savedSearches.length}</Badge>
            </TabsTrigger>

            <TabsTrigger value="messages" className="gap-1.5 shrink-0">
              <MessageSquare className="h-3.5 w-3.5" /> {td.messages}
              {unreadMessages > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white tabular-nums">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="analytics" className="shrink-0">{td.analytics}</TabsTrigger>
            {isBusiness && <TabsTrigger value="profile" className="shrink-0">{td.myCompany}</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="listings">
          <MyAuctionsTab
            cars={user.cars}
            isPrivate={isPrivate} isBusiness={isBusiness}
            carsListedThisYear={carsListedThisYear}
            carsWithNewBids={carsWithNewBids}
            locale={locale}
            markCarBidsRead={markCarBidsRead}
            onPublish={publishCar}
          />
        </TabsContent>

        <TabsContent value="bids">
          <MyBidsTab bids={user.bids} outbidCarIds={outbidCarIds} locale={locale} onOutbidRead={markOutbidRead} />
        </TabsContent>

        <TabsContent value="searches">
          <SavedSearchesTab savedSearches={user.savedSearches} onAdded={fetchUser} onDeleted={fetchUser} />
        </TabsContent>

        <TabsContent value="messages">
          <MessagesTab
            msgUsers={msgUsers}
            unreadPerSender={unreadPerSender}
            markSenderRead={markSenderRead}
            markMessagesRead={markMessagesRead}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab isBusiness={isBusiness} />
        </TabsContent>

        {isBusiness && (
          <TabsContent value="profile">
            <Card>
              <CardHeader><CardTitle className="text-base">Virksomhedsprofil</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Rediger din offentlige forhandlerprofil synlig på forhandlersiden.</p>
                <Link
                  href={`/${locale}/dashboard/profile`}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: 'var(--copper)', minHeight: 44 }}
                >
                  Rediger profil →
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </PageLayout>
  )
}

export default function UserDashboardPage() {
  return (
    <Suspense fallback={<LoadingPage maxWidth="max-w-5xl" />}>
      <DashboardContent />
    </Suspense>
  )
}
