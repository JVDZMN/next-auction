"use client"

import { Fragment, useEffect, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { LoadingPage, ErrorPage, PageLayout } from "@/components/PageLayout"
import { useLocale } from "@/lib/i18n/context"
import { useNotifications } from "@/lib/notification-context"
import { useUserChatSocket } from "@/lib/useUserChatSocket"
import { sendMessage as sendMessageAction } from "@/app/actions/messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus, Trash2, Send, ArrowLeft, MessageSquare,
  ChevronDown, ChevronRight, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface SavedSearch {
  id: string; label: string | null; brand: string | null; maxPrice: number | null
  minYear: number | null; fuel: string | null; notifyNewListing: boolean; createdAt: string
}
interface UserCar {
  id: string; brand: string; model: string; year: number; status: string
  isDraft: boolean; currentPrice: number; startingPrice: number
  auctionEndDate: string; createdAt: string; views: number; _count: { bids: number }
}
interface BidEntry {
  id: string; amount: number; createdAt: string
  bidder: { id: string; name: string | null; email: string }
}
interface User {
  id: string; name: string | null; email: string; image?: string | null
  role: string; createdAt: string; userType?: 'PRIVATE' | 'BUSINESS'
  cars: UserCar[]
  bids: Array<{
    id: string; amount: number; createdAt: string
    car: { id: string; brand: string; model: string; year: number; status: string; currentPrice: number; auctionEndDate: string }
  }>
  savedSearches: SavedSearch[]
}
interface ChatUser { id: string; name: string; image: string | null }
interface ChatMessage { senderId: string; content: string; carId?: string }

// ─── Status colour map ────────────────────────────────────────────────────────

const statusVariant: Record<string, string> = {
  active:           'bg-green-100 text-green-800 border-green-200',
  completed:        'bg-blue-100 text-blue-800 border-blue-200',
  reserve_not_met:  'bg-amber-100 text-amber-800 border-amber-200',
  cancelled:        'bg-red-100 text-red-800 border-red-200',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('da-DK', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

// ─── Inline bid audit log ─────────────────────────────────────────────────────

function BidAuditPanel({
  car, bids, loading, locale,
}: {
  car: UserCar
  bids: BidEntry[] | undefined
  loading: boolean
  locale: string
}) {
  return (
    <div className="p-4 border-t bg-muted/20 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          Bid History — {car.year} {car.brand} {car.model}
        </p>
        <Link
          href={`/${locale}/cars/${car.id}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3" /> View public listing
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      ) : !bids || bids.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No bids placed yet.</p>
      ) : (
        <div className="rounded-md border overflow-hidden bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Bidder</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bids.map((bid, i) => (
                <TableRow key={bid.id} className={i === 0 ? 'font-medium' : ''}>
                  <TableCell className="py-2 text-sm">
                    <Link
                      href={`/${locale}/dashboard/users/${bid.bidder.id}`}
                      className="text-primary hover:underline underline-offset-2"
                      onClick={e => e.stopPropagation()}
                    >
                      {bid.bidder.name || 'Anonymous'}
                    </Link>
                    {i === 0 && (
                      <span className="ml-2 text-[10px] font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-1.5 py-0.5">
                        Leading
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2 text-sm text-right font-mono">
                    {bid.amount.toLocaleString('da-DK')} kr
                  </TableCell>
                  <TableCell className="py-2 text-xs text-right text-muted-foreground">
                    {fmtDate(bid.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardContent() {
  const { data: session } = useSession()
  const router       = useRouter()
  const locale       = useLocale()
  const searchParams = useSearchParams()
  const {
    unreadMessages, carsWithNewBids, outbidCarIds,
    unreadPerSender, msgUsers,
    markMessagesRead, markCarBidsRead, markOutbidRead, markSenderRead,
  } = useNotifications()

  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') ?? 'listings')

  function switchTab(tab: string) {
    setActiveTab(tab)
    router.replace(`/${locale}/dashboard?tab=${tab}`, { scroll: false })
  }

  // ── User data ──────────────────────────────────────────────────────────────
  const [user,         setUser]         = useState<User | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [newSearch,    setNewSearch]    = useState({ label: '', brand: '', maxPrice: '', minYear: '', fuel: '' })
  const [addingSearch, setAddingSearch] = useState(false)
  const [showForm,     setShowForm]     = useState(false)

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

  // ── Auction bid-log expansion (My Auctions tab) ────────────────────────────
  const [expandedCarId,  setExpandedCarId]  = useState<string | null>(null)
  const [bidsByCarId,    setBidsByCarId]    = useState<Record<string, BidEntry[]>>({})
  const [bidLogLoading,  setBidLogLoading]  = useState(false)

  function toggleExpand(carId: string) {
    if (expandedCarId === carId) {
      setExpandedCarId(null)
      return
    }
    setExpandedCarId(carId)
    // Clear the "New bids" badge as soon as the owner opens the log
    if (carsWithNewBids.includes(carId)) markCarBidsRead(carId)
  }

  useEffect(() => {
    if (!expandedCarId || bidsByCarId[expandedCarId] !== undefined) return
    setBidLogLoading(true)
    fetch(`/api/bids?carId=${expandedCarId}`)
      .then(r => r.json())
      .then(d => setBidsByCarId(prev => ({ ...prev, [expandedCarId]: d.bids ?? [] })))
      .catch(() => setBidsByCarId(prev => ({ ...prev, [expandedCarId]: [] })))
      .finally(() => setBidLogLoading(false))
  }, [expandedCarId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Messages tab ──────────────────────────────────────────────────────────
  const [activeChatUser,  setActiveChatUser]  = useState<ChatUser | null>(null)
  const [chatMessages,    setChatMessages]    = useState<ChatMessage[]>([])
  const [chatInput,       setChatInput]       = useState('')
  const [activeChatCarId, setActiveChatCarId] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab !== 'messages') return
    markMessagesRead()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    if (!activeChatUser) return
    fetch(`/api/messages?peerId=${activeChatUser.id}`)
      .then(r => r.json())
      .then(data => {
        setChatMessages((data.messages ?? []).map((m: { senderId: string; content: string; carId: string }) => ({
          senderId: m.senderId, content: m.content ?? '', carId: m.carId,
        })))
        setActiveChatCarId((data.messages as { carId?: string }[])?.[0]?.carId ?? null)
      })
      .catch(() => { setChatMessages([]); setActiveChatCarId(null) })
  }, [activeChatUser])

  const handleIncoming = useCallback((msg: ChatMessage) => {
    setChatMessages(prev => [...prev, msg])
    if (msg.senderId && activeChatUser?.id === msg.senderId) {
      markSenderRead(msg.senderId)
    }
  }, [activeChatUser?.id, markSenderRead])
  useUserChatSocket(session?.user?.id ?? '', activeChatUser?.id ?? '', handleIncoming)

  async function sendMessage() {
    if (!chatInput.trim() || !session?.user || !activeChatUser) return
    const content = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { senderId: session.user.id, content }])
    if (activeChatCarId) {
      await sendMessageAction({ carId: activeChatCarId, receiverId: activeChatUser.id, content }).catch(() => {})
    }
  }

  // ── Saved searches ────────────────────────────────────────────────────────
  const handleAddSearch = async () => {
    setAddingSearch(true)
    try {
      await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newSearch.label || undefined, brand: newSearch.brand || undefined,
          maxPrice: newSearch.maxPrice ? parseFloat(newSearch.maxPrice) : undefined,
          minYear: newSearch.minYear ? parseInt(newSearch.minYear) : undefined,
          fuel: newSearch.fuel || undefined, notifyNewListing: true,
        }),
      })
      setNewSearch({ label: '', brand: '', maxPrice: '', minYear: '', fuel: '' })
      setShowForm(false)
      await fetchUser()
    } catch { /* ignore */ }
    finally { setAddingSearch(false) }
  }

  if (loading) return <LoadingPage maxWidth="max-w-5xl" />
  if (error || !user) return <ErrorPage message={error || "Failed to load"} maxWidth="max-w-5xl" />

  const activeCars        = user.cars.filter(c => c.status === 'active' && !c.isDraft)
  const totalViews        = user.cars.reduce((s, c) => s + c.views, 0)
  const totalBidsReceived = user.cars.reduce((s, c) => s + c._count.bids, 0)
  const soldCars          = user.cars.filter(c => c.status === 'completed')
  const initials          = (user.name ?? user.email).slice(0, 2).toUpperCase()
  const isPrivate         = user.userType === 'PRIVATE'
  const isBusiness        = user.userType === 'BUSINESS'
  const thisYear          = new Date().getFullYear()
  const carsListedThisYear = user.cars.filter(c => new Date(c.createdAt).getFullYear() === thisYear).length

  return (
    <PageLayout maxWidth="max-w-5xl">
      {/* ── Profile card ── */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user.name || user.email}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <Badge variant="secondary">{user.role}</Badge>
                {isPrivate  && <Badge variant="outline" style={{ borderColor: 'var(--copper)', color: 'var(--copper)' }}>🏠 Privat</Badge>}
                {isBusiness && <Badge variant="outline" style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}>🏢 Erhverv</Badge>}
                <Badge variant="outline">Tilmeldt {new Date(user.createdAt).toLocaleDateString('da-DK')}</Badge>
              </div>
              {isPrivate && (
                <p className="mt-2 text-xs" style={{ color: carsListedThisYear >= 2 ? 'red' : 'var(--text-muted)' }}>
                  Biler oprettet dette år: <strong>{carsListedThisYear} / 2</strong>
                  {carsListedThisYear >= 2 && ' — SKAT-grænse nået'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats ── */}
      {user.cars.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Auctions', value: activeCars.length },
            { label: 'Total Views',     value: totalViews },
            { label: 'Bids Received',   value: totalBidsReceived },
            { label: 'Cars Sold',       value: soldCars.length },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={switchTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">

          {/* My Auctions — pulsing amber badge if any car received new bids */}
          <TabsTrigger value="listings" className="gap-1.5">
            My Auctions
            <Badge variant="secondary" className="ml-1">{user.cars.length}</Badge>
            {carsWithNewBids.length > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white tabular-nums animate-pulse">
                {carsWithNewBids.length}
              </span>
            )}
          </TabsTrigger>

          {/* My Bids — pulsing red badge when outbid on any car */}
          <TabsTrigger value="bids" className="gap-1.5">
            My Bids
            <Badge variant="secondary" className="ml-1">{user.bids.length}</Badge>
            {outbidCarIds.length > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white tabular-nums animate-pulse">
                {outbidCarIds.length}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger value="searches">
            Saved Searches <Badge variant="secondary" className="ml-1.5">{user.savedSearches.length}</Badge>
          </TabsTrigger>

          <TabsTrigger value="messages" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Messages
            {unreadMessages > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white tabular-nums">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── My Auctions ────────────────────────────────────────────────── */}
        <TabsContent value="listings">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="font-semibold">
                {isBusiness ? 'Mine annoncer (ubegrænset)' : `Mine biler (${carsListedThisYear}/2 dette år)`}
              </h3>
              {isPrivate && carsListedThisYear >= 2 && (
                <p className="text-xs mt-0.5" style={{ color: 'red' }}>
                  SKAT-grænsen på 2 biler/år er nået. Kontakt os ved spørgsmål.
                </p>
              )}
            </div>
            <Button size="sm" onClick={() => router.push(`/${locale}/cars/create`)}
              disabled={isPrivate && carsListedThisYear >= 2}>
              <Plus className="h-4 w-4 mr-1" /> Ny annonce
            </Button>
          </div>
          {user.cars.length === 0 ? (
            <p className="text-muted-foreground text-sm">No listings yet.</p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Car</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Activity</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.cars.map(car => {
                    const hasNewBids = carsWithNewBids.includes(car.id)
                    const isExpanded = expandedCarId === car.id
                    return (
                      <Fragment key={car.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => toggleExpand(car.id)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {car.year} {car.brand} {car.model}
                              {hasNewBids && (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-300 animate-pulse">
                                  New bids
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              <Badge variant="outline" className={statusVariant[car.status] ?? ''}>{car.status}</Badge>
                              {car.isDraft && <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">draft</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{car.currentPrice.toLocaleString('da-DK')} kr</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{car.views} views · {car._count.bids} bids</TableCell>
                          <TableCell className="text-right pr-3">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                                onClick={e => { e.stopPropagation(); router.push(`/${locale}/cars/${car.id}`) }}>
                                View
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                                onClick={e => { e.stopPropagation(); router.push(`/${locale}/cars/${car.id}/edit`) }}>
                                Edit
                              </Button>
                              {car.isDraft && (
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                                  onClick={async e => {
                                    e.stopPropagation()
                                    const res = await fetch(`/api/cars/${car.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ isDraft: false }),
                                    })
                                    if (res.ok) fetchUser()
                                  }}>
                                  Publish
                                </Button>
                              )}
                              {isExpanded
                                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* ── Inline bid audit log ── */}
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={5} className="p-0">
                              <BidAuditPanel
                                car={car}
                                bids={bidsByCarId[car.id]}
                                loading={bidLogLoading && !bidsByCarId[car.id]}
                                locale={locale}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ─── My Bids ─────────────────────────────────────────────────────── */}
        <TabsContent value="bids">
          {user.bids.length === 0 ? (
            <p className="text-muted-foreground text-sm">No bids placed yet.</p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Car</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Your Bid</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.bids.map(bid => {
                    const isOutbid = outbidCarIds.includes(bid.car.id)
                    return (
                      <TableRow
                        key={bid.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          isOutbid && "bg-red-50 hover:bg-red-100/60"
                        )}
                        onClick={() => {
                          if (isOutbid) markOutbidRead(bid.car.id)
                          router.push(`/${locale}/cars/${bid.car.id}`)
                        }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {bid.car.year} {bid.car.brand} {bid.car.model}
                            {isOutbid && (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 border border-red-300 animate-pulse">
                                Outbid — click to re-bid
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusVariant[bid.car.status] ?? ''}>
                            {bid.car.status}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn("text-right font-semibold", isOutbid ? "text-red-600 line-through" : "text-primary")}>
                          {bid.amount.toLocaleString('da-DK')} kr
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {bid.car.currentPrice.toLocaleString('da-DK')} kr
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ─── Saved searches ──────────────────────────────────────────────── */}
        <TabsContent value="searches" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Saved Searches</h3>
            <Button size="sm" variant="outline" onClick={() => setShowForm(v => !v)}>
              <Plus className="h-4 w-4 mr-1" /> Add Search
            </Button>
          </div>
          {showForm && (
            <Card>
              <CardHeader><CardTitle className="text-sm">New Saved Search</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'label',    placeholder: 'Label (optional)', type: 'text' },
                    { key: 'brand',    placeholder: 'Brand (e.g. BMW)', type: 'text' },
                    { key: 'maxPrice', placeholder: 'Max price',        type: 'number' },
                    { key: 'minYear',  placeholder: 'Min year',         type: 'number' },
                    { key: 'fuel',     placeholder: 'Fuel type',        type: 'text' },
                  ].map(({ key, placeholder, type }) => (
                    <Input key={key} type={type} placeholder={placeholder}
                      value={newSearch[key as keyof typeof newSearch]}
                      onChange={e => setNewSearch(s => ({ ...s, [key]: e.target.value }))} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddSearch} disabled={addingSearch}>
                    {addingSearch ? 'Saving…' : 'Save Search'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {user.savedSearches.length === 0 ? (
            <p className="text-muted-foreground text-sm">No saved searches yet.</p>
          ) : (
            <div className="space-y-2">
              {user.savedSearches.map(s => (
                <div key={s.id} className="flex justify-between items-center rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">{s.label || 'Unnamed search'}</p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        s.brand,
                        s.maxPrice && `max ${s.maxPrice.toLocaleString('da-DK')} kr`,
                        s.minYear && `from ${s.minYear}`,
                        s.fuel,
                      ].filter(Boolean).join(' · ') || 'Any car'}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={async () => { await fetch(`/api/saved-searches/${s.id}`, { method: 'DELETE' }); fetchUser() }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Messages ────────────────────────────────────────────────────── */}
        <TabsContent value="messages">
          <div className="rounded-lg border overflow-hidden min-h-120 grid md:grid-cols-[260px_1fr]">
            <div className="border-b md:border-b-0 md:border-r">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Conversations</p>
              </div>
              {msgUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : (
                <ul>
                  {msgUsers.map(u => {
                    const unreadCount = unreadPerSender[u.id] ?? 0
                    return (
                      <li key={u.id}>
                        <button
                          onClick={() => { setActiveChatUser(u); markSenderRead(u.id) }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors",
                            activeChatUser?.id === u.id && "bg-muted"
                          )}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={u.image ?? undefined} />
                            <AvatarFallback className="text-xs">{u.name?.slice(0, 2).toUpperCase() ?? '?'}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate flex-1">{u.name}</span>
                          {unreadCount > 0 && (
                            <span className="ml-auto shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {activeChatUser ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-3 px-4 py-3 border-b">
                  <button onClick={() => setActiveChatUser(null)} className="md:hidden text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={activeChatUser.image ?? undefined} />
                    <AvatarFallback className="text-xs">{activeChatUser.name?.slice(0, 2).toUpperCase() ?? '?'}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm">{activeChatUser.name}</span>
                </div>

                <ScrollArea className="flex-1 p-4 min-h-0 h-80">
                  {chatMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Start the conversation.</p>
                  ) : (
                    <ul className="space-y-2">
                      {chatMessages.map((msg, i) => {
                        const isMine = msg.senderId === session?.user?.id
                        return (
                          <li key={i} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                            <span className={cn(
                              'max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-snug',
                              isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                            )}>
                              {msg.content}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </ScrollArea>

                <Separator />
                <form
                  onSubmit={e => { e.preventDefault(); void sendMessage() }}
                  className="flex items-center gap-2 p-3"
                >
                  <Input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 h-8 text-sm"
                    maxLength={2001}
                  />
                  <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={!chatInput.trim()}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>
            ) : (
              <div className="hidden md:flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <MessageSquare className="h-10 w-10 opacity-20" />
                <p className="text-sm">Select a conversation</p>
              </div>
            )}
          </div>
        </TabsContent>
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
