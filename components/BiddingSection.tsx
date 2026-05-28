'use client'

import { useState, useEffect, useLayoutEffect, useTransition, useCallback, useRef } from 'react'
import { placeBid as placeBidAction, setProxyBid } from '@/app/actions/bids'
import { getPusherClient } from '@/lib/pusher-client'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { PriceDisplay } from '@/components/PriceDisplay'
import { AuctionCountdown } from '@/components/AuctionCountdown'
import { useDict } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'

interface BidEntry {
  id: string
  amount: number
  createdAt: string | Date
  bidder: { name: string | null; email: string }
}

interface BiddingSectionProps {
  carId: string
  currentPrice: number
  auctionEndDate: string
  status: string
  ownerId: string
  reservePrice?: number | null
  bidIncrement?: number | null
  onBidPlaced?: () => void
  onPriceUpdate?: (price: number) => void
}

export function BiddingSection({
  carId, currentPrice, auctionEndDate, status, ownerId,
  reservePrice, bidIncrement, onBidPlaced, onPriceUpdate,
}: BiddingSectionProps) {
  const { data: session } = useSession()
  const dict = useDict()
  const t = dict.bidding

  const [livePrice,   setLivePrice]   = useState(currentPrice)
  const [bids,        setBids]        = useState<BidEntry[]>([])
  const [bidAmount,   setBidAmount]   = useState('')
  const [isPending,   startTransition] = useTransition()
  const [error,       setError]       = useState<string | null>(null)
  const [success,     setSuccess]     = useState<string | null>(null)
  const [isLoading,   setIsLoading]   = useState(true)
  const [proxyMax,    setProxyMax]    = useState('')
  const [proxyPending,setProxyPending]= useState(false)
  const [proxySuccess,setProxySuccess]= useState<string | null>(null)
  const [proxyError,  setProxyError]  = useState<string | null>(null)
  const [pendingAmount, setPendingAmount] = useState<number | null>(null)

  // Anti-snipe: detect extension
  const prevEndDate = useRef(auctionEndDate)
  useEffect(() => {
    if (prevEndDate.current !== auctionEndDate) {
      const prev = new Date(prevEndDate.current).getTime()
      const next = new Date(auctionEndDate).getTime()
      if (next > prev) {
        toast.warning(t.antiSnipe.title, { description: t.antiSnipe.body, duration: 5_000 })
      }
      prevEndDate.current = auctionEndDate
    }
  }, [auctionEndDate, t.antiSnipe.title, t.antiSnipe.body])

  const isAuctionActive = status === 'active' && new Date(auctionEndDate) > new Date()
  const isOwner         = Boolean(session?.user?.id && ownerId === session.user.id)
  const isAdmin         = session?.user?.role === 'Admin'
  const canSeeBidHistory = isOwner || isAdmin

  // Keep livePrice in sync if the parent re-renders with a fresh prop (e.g. on page load)
  useLayoutEffect(() => { setLivePrice(currentPrice) }, [currentPrice])

  const minNextBid = bidIncrement && bidIncrement > 0
    ? livePrice + bidIncrement
    : livePrice + 1

  const fetchBids = useCallback(async () => {
    try {
      const res = await fetch(`/api/bids?carId=${carId}`)
      if (res.ok) setBids((await res.json()).bids || [])
    } catch { /* non-fatal */ }
    finally { setIsLoading(false) }
  }, [carId])

  // Initial load for owner/admin bid history
  useEffect(() => {
    if (!canSeeBidHistory) return
    fetchBids()
  }, [carId, canSeeBidHistory, fetchBids])

  // Pusher: patch price and prepend to history directly — no fetchCar, no polling
  useEffect(() => {
    console.log('BiddingSection mounted, carId:', carId)
    const pusher  = getPusherClient()

    console.log('Pusher key:', process.env.NEXT_PUBLIC_PUSHER_KEY ?? 'MISSING')
    console.log('Pusher cluster:', process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'MISSING')
    pusher.connection.bind('state_change', (states: { current: string; previous: string }) =>
      console.log('Pusher state:', states.previous, '→', states.current)
    )
    pusher.connection.bind('connected',   () => console.log('✅ Pusher connected'))
    pusher.connection.bind('error',       (err: unknown) => console.log('❌ Pusher error:', err))
    pusher.connection.bind('failed',      () => console.log('❌ Pusher failed'))
    pusher.connection.bind('unavailable', () => console.log('⚠️ Pusher unavailable'))

    const channel = pusher.subscribe(`car-${carId}`)
    console.log('Subscribed to channel:', `car-${carId}`)

    channel.bind('bid-placed', (data: {
      currentPrice: number
      bidCount:     number
      bidderId:     string
      bidderName:   string
      bidId:        string
      timestamp:    string
    }) => {
      console.log('🔴 BID RECEIVED:', data)
      setLivePrice(data.currentPrice)
      onPriceUpdate?.(data.currentPrice)
      if (canSeeBidHistory) {
        setBids(prev => [{
          id:        data.bidId,
          amount:    data.currentPrice,
          createdAt: data.timestamp,
          bidder:    { name: data.bidderName, email: '' },
        }, ...prev])
      }
    })
    return () => {
      console.log('BiddingSection cleanup — unsubscribing car-' + carId)
      channel.unbind_all()
      pusher.unsubscribe(`car-${carId}`)
    }
  }, [carId, canSeeBidHistory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const amount = parseFloat(bidAmount)
    if (isNaN(amount) || amount < minNextBid) {
      setError(`${t.minimumBid}: ${minNextBid.toLocaleString('da-DK')} kr`)
      return
    }
    setPendingAmount(amount)
  }

  const confirmBid = () => {
    if (pendingAmount === null) return
    const amount = pendingAmount
    setPendingAmount(null)
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await placeBidAction(carId, amount)
      if ('error' in result) {
        setError(result.error)
        toast.error(result.error)
      } else {
        setSuccess(t.success)
        setBidAmount('')
        toast.success(t.success)
        fetchBids()
        onBidPlaced?.()
      }
    })
  }

  const handleProxySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProxyError(null)
    setProxySuccess(null)
    const max = parseFloat(proxyMax)
    if (isNaN(max) || max <= livePrice) {
      setProxyError(`${t.minimumBid}: ${livePrice.toLocaleString('da-DK')} kr`)
      return
    }
    setProxyPending(true)
    try {
      const result = await setProxyBid(carId, max)
      if ('error' in result) {
        setProxyError(result.error)
        toast.error(result.error)
      } else {
        const msg = t.proxyBid.success.replace('{amount}', max.toLocaleString('da-DK') + ' kr')
        setProxySuccess(msg)
        setProxyMax('')
        toast.success(msg)
      }
    } finally {
      setProxyPending(false)
    }
  }

  return (
    <>
      {/* Legal confirmation dialog */}
      <Dialog open={pendingAmount !== null} onOpenChange={open => { if (!open) setPendingAmount(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.legalDialog.title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {t.legalDialog.body}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between py-2 border-y">
            <span className="text-sm text-muted-foreground">{t.yourBidLabel}</span>
            <span className="text-2xl font-bold">{pendingAmount?.toLocaleString('da-DK')} kr</span>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPendingAmount(null)}>
              {t.legalDialog.cancel}
            </Button>
            <Button onClick={confirmBid} disabled={isPending}>
              {isPending ? <><Spinner className="mr-2 h-4 w-4" />{t.placing}</> : t.legalDialog.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {/* Current bid panel */}
        <div className="rounded-xl border p-5">
          <div className="flex items-start justify-between gap-4">
            <PriceDisplay price={livePrice} label={t.currentBid} size="lg" />
            {isAuctionActive && <AuctionCountdown endDate={auctionEndDate} className="mt-1" />}
          </div>

          {bids.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2 pl-4">
              {bids.length} {bids.length === 1 ? dict.cars.card.bid : dict.cars.card.bids}
            </p>
          )}

          {reservePrice != null && isAuctionActive && (
            <div className="mt-3 pl-4">
              {currentPrice >= reservePrice ? (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  {t.reserveMet}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                  {t.reserveNotMet}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Place bid form */}
        {session && isAuctionActive && !isOwner && (
          <div className="rounded-xl border p-5 space-y-4">
            <h3 className="font-semibold">{t.placeBid}</h3>

            {error   && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800"><CheckCircle2 className="h-4 w-4" /><AlertDescription>{success}</AlertDescription></Alert>}

            <p className="text-xs text-muted-foreground">
              {t.minimumBid}:{' '}
              <span className="font-semibold text-foreground">{minNextBid.toLocaleString('da-DK')} kr</span>
              {bidIncrement && bidIncrement > 0 && (
                <span className="text-muted-foreground/60"> · {t.increment}: {bidIncrement.toLocaleString('da-DK')} kr</span>
              )}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="bidAmount">{t.yourBidLabel}</Label>
                <Input
                  id="bidAmount"
                  type="number"
                  step="1"
                  min={minNextBid}
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  placeholder={`min. ${minNextBid.toLocaleString('da-DK')} kr`}
                  required
                />
              </div>
              <Button type="submit" className="w-full">{t.submit}</Button>
            </form>
          </div>
        )}

        {/* Proxy bid form */}
        {session && isAuctionActive && !isOwner && (
          <div className="rounded-xl border p-5 space-y-3">
            <div>
              <h3 className="font-semibold">{t.proxyBid.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t.proxyBid.description}</p>
            </div>
            {proxyError   && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{proxyError}</AlertDescription></Alert>}
            {proxySuccess && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800"><CheckCircle2 className="h-4 w-4" /><AlertDescription>{proxySuccess}</AlertDescription></Alert>}
            <form onSubmit={handleProxySubmit} className="flex gap-2">
              <Input
                type="number"
                step="1"
                min={minNextBid}
                value={proxyMax}
                onChange={e => setProxyMax(e.target.value)}
                placeholder={`${t.proxyBid.placeholder} (> ${livePrice.toLocaleString('da-DK')} kr)`}
                required
              />
              <Button type="submit" variant="secondary" disabled={proxyPending}>
                {proxyPending ? <Spinner className="h-4 w-4" /> : t.proxyBid.submit}
              </Button>
            </form>
          </div>
        )}

        {/* State messages */}
        {!session && isAuctionActive && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{t.signInRequired}</AlertDescription>
          </Alert>
        )}
        {isOwner && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{t.ownerCannotBid}</AlertDescription>
          </Alert>
        )}
        {!isAuctionActive && status === 'active' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{t.auctionEnded}</AlertDescription>
          </Alert>
        )}
        {status === 'completed' && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <span className="font-semibold">{t.status.completed}</span>
              <p className="text-xs mt-0.5">{t.status.completedBody}</p>
            </AlertDescription>
          </Alert>
        )}
        {status === 'reserve_not_met' && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <span className="font-semibold">{t.status.reserveNotMet}</span>
              <p className="text-xs mt-0.5">{t.status.reserveNotMetBody}</p>
            </AlertDescription>
          </Alert>
        )}
        {status === 'cancelled' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <span className="font-semibold">{t.status.cancelled}</span>
              <p className="text-xs mt-0.5">{t.status.cancelledBody}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Bid history (owner / admin) */}
        {canSeeBidHistory && (
          <div className="rounded-xl border p-5 space-y-3">
            <h3 className="font-semibold">{t.history.title}</h3>
            <Separator />
            {isLoading ? (
              <div className="flex justify-center py-6"><Spinner className="h-5 w-5" /></div>
            ) : bids.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t.history.empty}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.history.bidder}</TableHead>
                    <TableHead>{t.history.amount}</TableHead>
                    <TableHead className="text-right">{t.history.time}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.map((bid, i) => (
                    <TableRow key={bid.id} className={i === 0 ? 'bg-emerald-50' : undefined}>
                      <TableCell className="font-medium">
                        {bid.bidder.name ?? 'Anonym'}
                        {i === 0 && (
                          <Badge className="ml-2 bg-emerald-700 text-white text-[10px] h-4">
                            {t.history.leading}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">{bid.amount.toLocaleString('da-DK')} kr</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(bid.createdAt as unknown as string).toLocaleString('da-DK')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>
    </>
  )
}
