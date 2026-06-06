'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useLocale } from '@/lib/i18n/context'
import { useNotifications } from '@/lib/notification-context'
import { LoadingPage, ErrorPage, PageLayout } from '@/components/PageLayout'
import { BiddingSection } from '@/components/BiddingSection'
import { CarHeader } from '@/components/car-detail/CarHeader'
import { CarSpecs } from '@/components/car-detail/CarSpecs'
import { OwnerActions } from '@/components/car-detail/OwnerActions'
import { PaymentSection } from '@/components/PaymentSection'
import { DisputeSection } from '@/components/DisputeSection'
import MessageSeller from '@/components/MessageSeller'
import { Breadcrumb } from '@/components/Breadcrumb'
import type { Car } from '@/types/car'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CheckCircle2 } from 'lucide-react'

interface BidEntry {
  id: string; amount: number; createdAt: string
  bidder: { id: string; name: string | null; email: string }
}

export default function CarDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter()
  const { data: session } = useSession()
  const locale = useLocale()
  const { carsWithNewBids, markCarBidsRead } = useNotifications()
  const { id } = params instanceof Promise ? use(params) : params

  const [car,           setCar]           = useState<Car | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [bidLog,        setBidLog]        = useState<BidEntry[]>([])
  const [bidLogLoaded,  setBidLogLoaded]  = useState(false)
  const [cancelling,    setCancelling]    = useState(false)
  const [accepting,     setAccepting]     = useState(false)
  const [relisting,     setRelisting]     = useState(false)
  const [duplicating,   setDuplicating]   = useState(false)
  const [notifyClose,   setNotifyClose]   = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmAccept, setConfirmAccept] = useState(false)
  const [actionError,   setActionError]   = useState<string | null>(null)

  const fetchCar = useCallback(async () => {
    try {
      const res = await fetch(`/api/cars/${id}`)
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}))
        if (data.error === 'wrong_segment') { router.replace(`/${locale}/cars`); return }
      }
      if (!res.ok) throw new Error('Failed to fetch car')
      setCar(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [id, locale, router])

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchCar()
    fetch(`/api/cars/${id}/view`, { method: 'POST' }).catch(() => {})
  }, [id])
  /* eslint-enable react-hooks/exhaustive-deps */

  const isOwner = !!session?.user?.id && session.user.id === car?.owner?.id

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

  const handlePriceUpdate = useCallback((price: number) => {
    setCar(prev => prev ? { ...prev, currentPrice: price } : prev)
  }, [])

  if (loading) return <LoadingPage />
  if (error || !car) return <ErrorPage message={error || 'Car not found'} />

  const handleCancelAuction = async () => {
    setCancelling(true); setActionError(null)
    try {
      const res = await fetch(`/api/cars/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) })
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

  const handleRelist = async (endDate: string) => {
    setRelisting(true); setActionError(null)
    try {
      const res = await fetch(`/api/cars/${id}/relist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ auctionEndDate: new Date(endDate).toISOString() }) })
      if (!res.ok) throw new Error()
      await fetchCar()
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

  const handlePublish = async () => {
    const res = await fetch(`/api/cars/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDraft: false }) })
    if (res.ok) await fetchCar()
  }

  const handleNotifyToggle = async (checked: boolean) => {
    setNotifyClose(checked)
    await fetch(`/api/cars/${id}/like`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notifyNearClose: checked }) }).catch(() => {})
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://next-auction-iota.vercel.app'
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Cars',     item: `${baseUrl}/${locale}/cars` },
      { '@type': 'ListItem', position: 2, name: car.brand,  item: `${baseUrl}/${locale}/cars?brand=${encodeURIComponent(car.brand)}` },
      { '@type': 'ListItem', position: 3, name: car.model,  item: `${baseUrl}/${locale}/cars?brand=${encodeURIComponent(car.brand)}&model=${encodeURIComponent(car.model)}` },
      { '@type': 'ListItem', position: 4, name: `${car.year} ${car.brand} ${car.model}` },
    ],
  }

  return (
    <PageLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Breadcrumb items={[
        { label: 'Cars', href: `/${locale}/cars` },
        { label: car.brand, href: `/${locale}/cars?brand=${encodeURIComponent(car.brand)}` },
        { label: car.model, href: `/${locale}/cars?brand=${encodeURIComponent(car.brand)}&model=${encodeURIComponent(car.model)}` },
        { label: `${car.year} ${car.brand} ${car.model}` },
      ]} />

      <div className="space-y-6">
        <CarHeader
          brand={car.brand} model={car.model} year={car.year}
          status={car.status} images={car.images} currentPrice={car.currentPrice}
          views={car.views} ownerName={car.owner.name} ownerVerified={!!car.owner.sellerVerified}
          isOwner={isOwner} isDraft={car.isDraft}
          onPublish={handlePublish}
        />

        <CarSpecs
          year={car.year} km={car.km} power={car.power} condition={car.condition}
          fuel={car.fuel} startingPrice={car.startingPrice} auctionEndDate={car.auctionEndDate}
          bidIncrement={car.bidIncrement} status={car.status}
        />

        {(car.vin || car.inspectionReportUrl || car.serviceHistoryUrls?.length > 0) && (
          <Card>
            <CardHeader><CardTitle className="text-base">Vehicle Documentation</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {car.vin && <p><span className="text-muted-foreground font-medium">VIN:</span> <span className="font-mono">{car.vin}</span></p>}
              {car.inspectionReportUrl && (
                <p><span className="text-muted-foreground font-medium">Inspection Report: </span>
                  <a href={car.inspectionReportUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Report</a></p>
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

        {car.description && (
          <Card>
            <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">{car.description}</p></CardContent>
          </Card>
        )}

        {car.specs && (
          <Card>
            <CardHeader><CardTitle className="text-base">Additional Notes</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">{car.specs}</p></CardContent>
          </Card>
        )}

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

        <Card>
          <CardContent className="pt-6 space-y-4">
            {actionError && <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert>}

            <BiddingSection
              carId={car.id} currentPrice={car.currentPrice} auctionEndDate={car.auctionEndDate}
              status={car.status} ownerId={car.owner.id}
              ownerRole={(car.owner as { role?: string }).role === 'BUSINESS_USER' ? 'BUSINESS_USER' : 'PRIVATE_USER'}
              reservePrice={car.reservePrice} bidIncrement={car.bidIncrement}
              onBidPlaced={fetchCar} onPriceUpdate={handlePriceUpdate}
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

            {session && !isOwner && ['pending_payment', 'second_chance'].includes(car.status) && (
              <PaymentSection carId={car.id} amount={car.currentPrice}
                deadline={(car as unknown as { paymentDeadline?: string | null }).paymentDeadline ?? null} locale={locale} />
            )}

            {session && !isOwner && car.status === 'completed' && (
              <DisputeSection carId={car.id}
                disputeDeadline={(car as unknown as { disputeDeadline?: string | null }).disputeDeadline ?? null} />
            )}

            <MessageSeller carId={car.id} ownerId={car.owner.id} ownerName={car.owner.name || 'Seller'} />

            <Separator />

            {isOwner && (
              <OwnerActions
                carId={car.id} locale={locale}
                hasBids={car.bids.length > 0} status={car.status}
                cancelling={cancelling} duplicating={duplicating} relisting={relisting}
                onCancel={() => setConfirmCancel(true)}
                onDuplicate={handleDuplicate}
                onRelist={handleRelist}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Auction</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to cancel this auction? This cannot be undone.</AlertDialogDescription>
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
            <AlertDialogDescription>Accept the highest bid of {car.currentPrice.toLocaleString('da-DK')} kr and close this auction as sold?</AlertDialogDescription>
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
