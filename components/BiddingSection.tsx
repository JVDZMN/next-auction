'use client'

import { useState, useEffect, useLayoutEffect, useTransition, useCallback, useRef } from 'react'
import { placeBid as placeBidAction, setProxyBid } from '@/app/actions/bids'
import { getPusherClient } from '@/lib/pusher-client'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { PriceDisplay } from '@/components/PriceDisplay'
import { AuctionCountdown } from '@/components/AuctionCountdown'
import { useDict } from '@/lib/i18n/context'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { hasPermission } from '@/lib/permissions'
import { BidConfirmDialog } from '@/components/bidding/BidConfirmDialog'
import { PlaceBidForm } from '@/components/bidding/PlaceBidForm'
import { ProxyBidForm } from '@/components/bidding/ProxyBidForm'
import { BidHistoryTable } from '@/components/bidding/BidHistoryTable'
import { AuctionStatusAlerts } from '@/components/bidding/AuctionStatusAlerts'

interface BidEntry {
  id: string; amount: number; createdAt: string | Date
  bidder: { name: string | null; email: string }
}

export interface BiddingSectionProps {
  carId: string; currentPrice: number; auctionEndDate: string
  status: string; ownerId: string; ownerRole: 'PRIVATE_USER' | 'BUSINESS_USER'
  reservePrice?: number | null; bidIncrement?: number | null
  onBidPlaced?: () => void; onPriceUpdate?: (price: number) => void
}

export function BiddingSection({
  carId, currentPrice, auctionEndDate, status, ownerId, ownerRole,
  reservePrice, bidIncrement, onBidPlaced, onPriceUpdate,
}: BiddingSectionProps) {
  const { data: session } = useSession()
  const dict = useDict()
  const t = dict.bidding

  const [livePrice,     setLivePrice]     = useState(currentPrice)
  const [bids,          setBids]          = useState<BidEntry[]>([])
  const [bidAmount,     setBidAmount]     = useState('')
  const [isPending,     startTransition]  = useTransition()
  const [error,         setError]         = useState<string | null>(null)
  const [success,       setSuccess]       = useState<string | null>(null)
  const [isLoading,     setIsLoading]     = useState(true)
  const [proxyMax,      setProxyMax]      = useState('')
  const [proxyPending,  setProxyPending]  = useState(false)
  const [proxySuccess,  setProxySuccess]  = useState<string | null>(null)
  const [proxyError,    setProxyError]    = useState<string | null>(null)
  const [pendingAmount, setPendingAmount] = useState<number | null>(null)
  const [isEnded,       setIsEnded]       = useState(() => new Date() > new Date(auctionEndDate))

  // setTimeout max is ~24 days, so we re-check every minute for long auctions
  // instead of scheduling one giant timer that the browser may clamp or lose.
  useEffect(() => {
    const checkStatus = () => {
      const timeLeft = new Date(auctionEndDate).getTime() - Date.now()
      if (timeLeft <= 0) { setIsEnded(true) }
      else {
        const timer = setTimeout(checkStatus, Math.min(timeLeft, 60000))
        return () => clearTimeout(timer)
      }
    }
    return checkStatus()
  }, [auctionEndDate])

  // Anti-snipe: detect extension
  const prevEndDate = useRef(auctionEndDate)
  useEffect(() => {
    if (prevEndDate.current !== auctionEndDate) {
      const next = new Date(auctionEndDate).getTime()
      const prev = new Date(prevEndDate.current).getTime()
      if (next > prev) toast.warning(t.antiSnipe.title, { description: t.antiSnipe.body, duration: 5_000 })
      prevEndDate.current = auctionEndDate
    }
  }, [auctionEndDate, t.antiSnipe.title, t.antiSnipe.body])

  const isAuctionActive  = status === 'active' && new Date(auctionEndDate) > new Date()
  const isOwner          = Boolean(session?.user?.id && ownerId === session.user.id)
  const isAdmin          = session?.user?.role === 'ADMIN'
  const canSeeBidHistory = isOwner || isAdmin
  const minNextBid       = bidIncrement && bidIncrement > 0 ? livePrice + bidIncrement : livePrice + 1

  // useLayoutEffect (not useEffect) prevents a visible flash of the stale price
  // when the parent re-renders with a fresh prop after a bid is placed.
  useLayoutEffect(() => { setLivePrice(currentPrice) }, [currentPrice])

  const fetchBids = useCallback(async () => {
    try {
      const res = await fetch(`/api/bids?carId=${carId}`)
      if (res.ok) setBids((await res.json()).bids || [])
    } catch { /* non-fatal */ }
    finally { setIsLoading(false) }
  }, [carId])

  useEffect(() => { if (canSeeBidHistory) fetchBids() }, [carId, canSeeBidHistory, fetchBids])

  // Pusher: live price + bid history updates
  useEffect(() => {
    const pusher  = getPusherClient()
    const channel = pusher.subscribe(`car-${carId}`)
    channel.bind('auction-ended', () => setIsEnded(true))
    channel.bind('bid-placed', (data: { currentPrice: number; bidderId: string; bidderName: string; bidId: string; timestamp: string }) => {
      setLivePrice(data.currentPrice)
      onPriceUpdate?.(data.currentPrice)
      if (canSeeBidHistory) {
        setBids(prev => [{ id: data.bidId, amount: data.currentPrice, createdAt: data.timestamp, bidder: { name: data.bidderName, email: '' } }, ...prev])
      }
    })
    return () => {
      channel.unbind('bid-placed')
      channel.unbind('auction-ended')
      pusher.unsubscribe(`car-${carId}`)
    }
  }, [carId, canSeeBidHistory, onPriceUpdate])

  // Permission guard (after all hooks)
  if (session?.user && session.user.id !== ownerId && session.user.role !== 'ADMIN') {
    const permission = ownerRole === 'BUSINESS_USER' ? 'canBidOnBusinessCars' : 'canBidOnPrivateCars'
    const canBid = hasPermission(session.user.role, permission, session.user.isApprovedByAdmin)
    if (!canBid) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {ownerRole === 'BUSINESS_USER'
              ? 'Denne auktion er kun for erhvervsbrugere med CVR'
              : session.user.role !== ownerRole
                ? 'Denne auktion er kun for private brugere'
                : 'Din erhvervskonto er endnu ikke godkendt af en administrator'}
          </AlertDescription>
        </Alert>
      )
    }
  }

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
    setPendingAmount(null); setError(null); setSuccess(null)
    startTransition(async () => {
      const result = await placeBidAction(carId, amount)
      if ('error' in result) {
        setError(result.error); toast.error(result.error)
      } else {
        setSuccess(t.success); setBidAmount(''); toast.success(t.success)
        fetchBids(); onBidPlaced?.()
      }
    })
  }

  const handleProxySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProxyError(null); setProxySuccess(null)
    const max = parseFloat(proxyMax)
    if (isNaN(max) || max <= livePrice) {
      setProxyError(`${t.minimumBid}: ${livePrice.toLocaleString('da-DK')} kr`); return
    }
    setProxyPending(true)
    try {
      const result = await setProxyBid(carId, max)
      if ('error' in result) {
        setProxyError(result.error); toast.error(result.error)
      } else {
        const msg = t.proxyBid.success.replace('{amount}', max.toLocaleString('da-DK') + ' kr')
        setProxySuccess(msg); setProxyMax(''); toast.success(msg)
      }
    } finally { setProxyPending(false) }
  }

  return (
    <>
      <BidConfirmDialog
        amount={pendingAmount}
        isPending={isPending}
        labels={{ title: t.legalDialog.title, body: t.legalDialog.body, yourBidLabel: t.yourBidLabel, cancel: t.legalDialog.cancel, confirm: t.legalDialog.confirm, placing: t.placing }}
        onConfirm={confirmBid}
        onCancel={() => setPendingAmount(null)}
      />

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
              {livePrice >= reservePrice
                ? <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{t.reserveMet}</Badge>
                : <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">{t.reserveNotMet}</Badge>}
            </div>
          )}
        </div>

        {session && isAuctionActive && !isOwner && (
          <PlaceBidForm
            bidAmount={bidAmount} minNextBid={minNextBid} bidIncrement={bidIncrement}
            isEnded={isEnded} error={error} success={success}
            labels={{ placeBid: t.placeBid, minimumBid: t.minimumBid, increment: t.increment, yourBidLabel: t.yourBidLabel, submit: t.submit, auctionEnded: t.auctionEnded }}
            onChange={setBidAmount}
            onSubmit={handleSubmit}
          />
        )}

        {session && isAuctionActive && !isOwner && (
          <ProxyBidForm
            proxyMax={proxyMax} livePrice={livePrice} minNextBid={minNextBid}
            isEnded={isEnded} isPending={proxyPending} error={proxyError} success={proxySuccess}
            labels={{ title: t.proxyBid.title, description: t.proxyBid.description, placeholder: t.proxyBid.placeholder, submit: t.proxyBid.submit }}
            onChange={setProxyMax}
            onSubmit={handleProxySubmit}
          />
        )}

        <AuctionStatusAlerts
          status={status} isAuctionActive={isAuctionActive}
          isOwner={isOwner} isSessionPresent={!!session}
          labels={{ signInRequired: t.signInRequired, ownerCannotBid: t.ownerCannotBid, auctionEnded: t.auctionEnded, status: t.status }}
        />

        {canSeeBidHistory && (
          <BidHistoryTable
            bids={bids} isLoading={isLoading}
            labels={{ title: t.history.title, empty: t.history.empty, bidder: t.history.bidder, amount: t.history.amount, time: t.history.time, leading: t.history.leading }}
          />
        )}
      </div>
    </>
  )
}
