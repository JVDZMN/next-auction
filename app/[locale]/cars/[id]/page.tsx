'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingPage, ErrorPage, PageLayout } from '@/components/PageLayout'
import { BiddingSection } from '@/components/BiddingSection'
import { CarImageGallery } from '@/components/CarImageGallery'
import { PriceDisplay } from '@/components/PriceDisplay'
import { AuctionCountdown } from '@/components/AuctionCountdown'
import MessageSeller from '@/components/MessageSeller'
import { useSession } from 'next-auth/react'
import { useLocale } from '@/lib/i18n/context'
import { useNotifications } from '@/lib/notification-context'
import type { Car } from '@/types/car'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { BadgeCheck, Eye, Pencil, Copy, XCircle, CalendarClock, CheckCircle2 } from 'lucide-react'
import { getPusherClient } from '@/lib/pusher-client'

interface BidEntry {
  id: string
  amount: number
  createdAt: string
  bidder: { id: string; name: string | null; email: string }
}

const statusVariant: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  reserve_not_met: 'bg-amber-100 text-amber-800 border-amber-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

export default function CarDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter()
  const { data: session } = useSession()
  const locale = useLocale()
  const { carsWithNewBids, markCarBidsRead } = useNotifications()
  const resolvedParams = params instanceof Promise ? use(params) : params
  const { id } = resolvedParams
  const [car, setCar] = useState<Car | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bidLog, setBidLog] = useState<BidEntry[]>([])
  const [bidLogLoaded, setBidLogLoaded] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [relisting, setRelisting] = useState(false)
  const [relistDate, setRelistDate] = useState('')
  const [showRelistForm, setShowRelistForm] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [notifyClose, setNotifyClose] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmAccept, setConfirmAccept] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    fetchCar()
    fetch(`/api/cars/${id}/view`, { method: 'POST' }).catch(() => {})
  }, [id])

  useEffect(() => {
    if (!car || car.status !== 'active') return
    const interval = setInterval(fetchCar, 15000)
    return () => clearInterval(interval)
  }, [car?.status])

  const isOwner = !!session?.user?.id && session.user.id === car?.owner?.id

  // Load bid log for owner; mark car bids read once loaded
  useEffect(() => {
    if (!isOwner || bidLogLoaded) return
    fetch(`/api/bids?carId=${id}`)
      .then(r => r.json())
      .then(data => {
        setBidLog(data.bids || [])
        setBidLogLoaded(true)
        if (carsWithNewBids.includes(id)) markCarBidsRead(id)
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, id])

  const fetchCar = useCallback(async () => {
    try {
      const response = await fetch(`/api/cars/${id}`)
      if (!response.ok) throw new Error('Failed to fetch car')
      setCar(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [id])

  // Real-time price updates when anyone places a bid
  useEffect(() => {
    const pusher  = getPusherClient()
    const channel = pusher.subscribe(`car-${id}`)
    channel.bind('bid-placed', fetchCar)
    return () => {
      channel.unbind('bid-placed', fetchCar)
      pusher.unsubscribe(`car-${id}`)
    }
  }, [id, fetchCar])

  if (loading) return <LoadingPage />
  if (error || !car) return <ErrorPage message={error || 'Car not found'} />

  const handleCancelAuction = async () => {
    setCancelling(true); setActionError(null)
    try {
      const res = await fetch(`/api/cars/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) throw new Error()
      await fetchCar()
    } catch { setActionError('Failed to cancel auction. Please try again.') }
    finally { setCancelling(false); setConfirmCancel(false) }
  }

  const handleAcceptHighestBid = async () => {
    setAccepting(true); setActionError(null)
    try {
      const res = await fetch(`/api/cars/${id}/accept-bid`, { method: 'POST' })
      if (!res.ok) throw new Error()
      await fetchCar()
    } catch { setActionError('Failed to accept bid. Please try again.') }
    finally { setAccepting(false); setConfirmAccept(false) }
  }

  const handleRelist = async () => {
    if (!relistDate) return
    setRelisting(true); setActionError(null)
    try {
      const res = await fetch(`/api/cars/${id}/relist`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionEndDate: new Date(relistDate).toISOString() }),
      })
      if (!res.ok) throw new Error()
      setShowRelistForm(false); await fetchCar()
    } catch { setActionError('Failed to relist. Please try again.') }
    finally { setRelisting(false) }
  }

  const handleDuplicate = async () => {
    setDuplicating(true); setActionError(null)
    try {
      const res = await fetch(`/api/cars/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      router.push(`/${locale}/cars/${data.id}`)
    } catch { setActionError('Failed to duplicate listing. Please try again.') }
    finally { setDuplicating(false) }
  }

  const handleNotifyToggle = async (checked: boolean) => {
    setNotifyClose(checked)
    await fetch(`/api/cars/${id}/like`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifyNearClose: checked }),
    }).catch(() => {})
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Images + title */}
        <Card className="overflow-hidden">
          <CardContent className="p-4 pb-0">
            <CarImageGallery images={car.images} alt={`${car.year} ${car.brand} ${car.model}`} />
          </CardContent>
          <CardContent className="pt-4 pb-6">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold">{car.year} {car.brand} {car.model}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-muted-foreground text-sm">Listed by {car.owner.name}</p>
                  {car.owner.sellerVerified && (
                    <Badge variant="secondary" className="gap-1">
                      <BadgeCheck className="h-3 w-3" /> Verified Seller
                    </Badge>
                  )}
                  {isOwner && (
                    <Badge variant="outline" className="gap-1">
                      <Eye className="h-3 w-3" /> {car.views} view{car.views !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <PriceDisplay price={car.currentPrice} label="Aktuel pris" size="lg" />
                <Badge variant="outline" className={`mt-1 ${statusVariant[car.status] ?? ''}`}>{car.status}</Badge>
              </div>
            </div>
            {isOwner && car.isDraft && (
              <Alert className="mt-4 border-amber-200 bg-amber-50 text-amber-800">
                <AlertDescription className="flex items-center justify-between gap-4">
                  <span>This listing is a draft and not visible to other users.</span>
                  <Button
                    size="sm"
                    onClick={async () => {
                      const res = await fetch(`/api/cars/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isDraft: false }),
                      })
                      if (res.ok) await fetchCar()
                    }}
                  >
                    Publish
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Specs */}
        <Card>
          <CardHeader><CardTitle className="text-base">Specifications</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Year',           value: String(car.year) },
                { label: 'Kilometers',     value: `${car.km.toLocaleString()} km` },
                { label: 'Power',          value: `${car.power} HP` },
                { label: 'Condition',      value: car.condition },
                { label: 'Fuel',           value: car.fuel },
                { label: 'Starting Price', value: `${car.startingPrice.toLocaleString('da-DK')} kr` },
                { label: 'Auction Ends',   value: new Date(car.auctionEndDate).toLocaleDateString('da-DK') },
                ...(car.bidIncrement ? [{ label: 'Bid Increment', value: `${car.bidIncrement.toLocaleString('da-DK')} kr` }] : []),
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-semibold capitalize text-sm">{value}</p>
                </div>
              ))}
            </div>
            {car.status === 'active' && (
              <div className="mt-4">
                <AuctionCountdown endDate={car.auctionEndDate} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documentation */}
        {(car.vin || car.inspectionReportUrl || car.serviceHistoryUrls?.length > 0) && (
          <Card>
            <CardHeader><CardTitle className="text-base">Vehicle Documentation</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {car.vin && (
                <p><span className="text-muted-foreground font-medium">VIN:</span> <span className="font-mono">{car.vin}</span></p>
              )}
              {car.inspectionReportUrl && (
                <p>
                  <span className="text-muted-foreground font-medium">Inspection Report: </span>
                  <a href={car.inspectionReportUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Report</a>
                </p>
              )}
              {car.serviceHistoryUrls?.length > 0 && (
                <div>
                  <span className="text-muted-foreground font-medium">Service History: </span>
                  {car.serviceHistoryUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mr-2">Document {i + 1}</a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {car.description && (
          <Card>
            <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">{car.description}</p>
            </CardContent>
          </Card>
        )}

        {car.specs && (
          <Card>
            <CardHeader><CardTitle className="text-base">Additional Notes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">{car.specs}</p>
            </CardContent>
          </Card>
        )}

        {/* Owner bid activity log */}
        {isOwner && bidLog.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Bid Activity</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bidder</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bidLog.map(bid => (
                    <TableRow key={bid.id}>
                      <TableCell className="text-sm">{bid.bidder.name || bid.bidder.email}</TableCell>
                      <TableCell className="text-right font-semibold text-sm">{bid.amount.toLocaleString('da-DK')} kr</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(bid.createdAt).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Bidding + owner actions */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {actionError && (
              <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert>
            )}

            <BiddingSection
              carId={car.id}
              currentPrice={car.currentPrice}
              auctionEndDate={car.auctionEndDate}
              status={car.status}
              ownerId={car.owner.id}
              reservePrice={car.reservePrice}
              bidIncrement={car.bidIncrement}
              onBidPlaced={fetchCar}
            />

            {isOwner && car.status === 'reserve_not_met' && car.bids.length > 0 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertDescription>
                  <p className="font-semibold text-amber-800 mb-1">Reserve not met</p>
                  <p className="text-amber-700 text-sm mb-3">
                    The highest bid was <strong>{car.currentPrice.toLocaleString('da-DK')} kr</strong>. You can accept it and close the auction as sold.
                  </p>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setConfirmAccept(true)}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Accept Highest Bid
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {session && !isOwner && car.status === 'active' && (
              <div className="flex items-center gap-2">
                <Checkbox id="notifyClose" checked={notifyClose} onCheckedChange={v => handleNotifyToggle(!!v)} />
                <Label htmlFor="notifyClose" className="text-sm cursor-pointer">Email me when this auction is closing soon</Label>
              </div>
            )}

            <MessageSeller carId={car.id} ownerId={car.owner.id} ownerName={car.owner.name || 'Seller'} />

            <Separator />

            {isOwner && ['cancelled', 'reserve_not_met'].includes(car.status) && (
              <div>
                {showRelistForm ? (
                  <div className="space-y-3 p-4 border rounded-lg">
                    <Label className="text-sm font-medium">New auction end date</Label>
                    <Input
                      type="datetime-local"
                      value={relistDate}
                      onChange={e => setRelistDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleRelist} disabled={relisting || !relistDate}>
                        <CalendarClock className="h-4 w-4 mr-1" />
                        {relisting ? 'Relisting…' : 'Confirm Relist'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowRelistForm(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowRelistForm(true)}>
                    <CalendarClock className="h-4 w-4 mr-1" /> Relist Auction
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => router.back()}>Back</Button>
              {isOwner && car.bids.length === 0 && (
                <Button variant="outline" onClick={() => router.push(`/${locale}/cars/${car.id}/edit`)}>
                  <Pencil className="h-4 w-4 mr-1" /> Edit Listing
                </Button>
              )}
              {isOwner && (
                <Button variant="secondary" onClick={handleDuplicate} disabled={duplicating}>
                  <Copy className="h-4 w-4 mr-1" />
                  {duplicating ? 'Duplicating…' : 'Duplicate as Draft'}
                </Button>
              )}
              {isOwner && car.status === 'active' && (
                <Button variant="destructive" onClick={() => setConfirmCancel(true)} disabled={cancelling}>
                  <XCircle className="h-4 w-4 mr-1" />
                  {cancelling ? 'Cancelling…' : 'Cancel Auction'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Auction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this auction? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Auction</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelAuction} disabled={cancelling} className="bg-destructive hover:bg-destructive/90">
              {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAccept} onOpenChange={setConfirmAccept}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Highest Bid</AlertDialogTitle>
            <AlertDialogDescription>
              Accept the highest bid of {car.currentPrice.toLocaleString('da-DK')} kr and close this auction as sold?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={accepting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptHighestBid} disabled={accepting} className="bg-green-600 hover:bg-green-700">
              {accepting ? 'Processing…' : 'Accept Bid'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  )
}
