'use client'

import { useState, useEffect, useTransition, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Prisma } from '@prisma/client'
import { PriceDisplay } from '@/components/PriceDisplay'
import { AuctionCountdown } from '@/components/AuctionCountdown'
import { useDict } from '@/lib/i18n/context'

type BidWithBidder = Prisma.BidGetPayload<{ include: { bidder: true } }>

interface BiddingSectionProps {
  carId: string
  currentPrice: number
  auctionEndDate: string
  status: string
  ownerId: string
  reservePrice?: number | null
  bidIncrement?: number | null
  onBidPlaced?: () => void
}

export function BiddingSection({
  carId,
  currentPrice,
  auctionEndDate,
  status,
  ownerId,
  reservePrice,
  bidIncrement,
  onBidPlaced,
}: BiddingSectionProps) {
  const { data: session } = useSession()
  const dict = useDict()
  const t = dict.bidding

  const [bids, setBids] = useState<BidWithBidder[]>([])
  const [bidAmount, setBidAmount] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [proxyMax, setProxyMax] = useState('')
  const [proxyPending, setProxyPending] = useState(false)
  const [proxySuccess, setProxySuccess] = useState<string | null>(null)
  const [proxyError, setProxyError] = useState<string | null>(null)

  // ── Legal confirmation dialog ─────────────────────────────────────────────
  const [pendingAmount, setPendingAmount] = useState<number | null>(null)

  // ── Anti-snipe toast ──────────────────────────────────────────────────────
  const prevEndDate = useRef(auctionEndDate)
  const [antiSnipeVisible, setAntiSnipeVisible] = useState(false)

  useEffect(() => {
    if (prevEndDate.current !== auctionEndDate) {
      const prev = new Date(prevEndDate.current).getTime()
      const next = new Date(auctionEndDate).getTime()
      if (next > prev) {
        setAntiSnipeVisible(true)
        const id = setTimeout(() => setAntiSnipeVisible(false), 5_000)
        prevEndDate.current = auctionEndDate
        return () => clearTimeout(id)
      }
      prevEndDate.current = auctionEndDate
    }
  }, [auctionEndDate])

  const isAuctionActive = status === 'active' && new Date(auctionEndDate) > new Date()
  const isOwner = session?.user?.id && ownerId === session.user.id
  const isAdmin = session?.user?.role === 'Admin'
  const canSeeBidHistory = Boolean(isOwner || isAdmin)

  const minNextBid = bidIncrement && bidIncrement > 0
    ? currentPrice + bidIncrement
    : currentPrice + 1

  useEffect(() => {
    if (!canSeeBidHistory) return
    fetchBids()
    const interval = setInterval(fetchBids, 5_000)
    return () => clearInterval(interval)
  }, [carId, canSeeBidHistory])

  const fetchBids = useCallback(async () => {
    try {
      const res = await fetch(`/api/bids?carId=${carId}`)
      if (res.ok) {
        const data = await res.json()
        setBids(data.bids || [])
      }
    } catch { /* non-fatal */ }
    finally { setIsLoading(false) }
  }, [carId])

  // ── Step 1: validate → open legal dialog ─────────────────────────────────
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

  // ── Step 2: user confirmed legal dialog → actually place bid ──────────────
  const confirmBid = () => {
    if (pendingAmount === null) return
    const amount = pendingAmount
    setPendingAmount(null)
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/bids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ carId, amount }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to place bid')
        setSuccess(t.success)
        setBidAmount('')
        fetchBids()
        onBidPlaced?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to place bid')
      }
    })
  }

  const handleProxySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProxyError(null)
    setProxySuccess(null)
    const max = parseFloat(proxyMax)
    if (isNaN(max) || max <= currentPrice) {
      setProxyError(`${t.minimumBid}: ${currentPrice.toLocaleString('da-DK')} kr`)
      return
    }
    setProxyPending(true)
    try {
      const res = await fetch('/api/proxy-bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId, maxAmount: max }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setProxySuccess(t.proxyBid.success.replace('{amount}', max.toLocaleString('da-DK') + ' kr'))
      setProxyMax('')
    } catch (err) {
      setProxyError(err instanceof Error ? err.message : 'Failed to set proxy bid')
    } finally {
      setProxyPending(false)
    }
  }

  return (
    <>
      {/* ── Anti-snipe toast ──────────────────────────────────────────────── */}
      <div
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
          antiSnipeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-start gap-3 px-5 py-3.5 bg-stone-900 text-white rounded-xl shadow-xl max-w-sm">
          <span className="text-amber-400 mt-0.5">⏱</span>
          <div>
            <p className="font-semibold text-sm">{t.antiSnipe.title}</p>
            <p className="text-xs text-stone-300 mt-0.5">{t.antiSnipe.body}</p>
          </div>
          <button onClick={() => setAntiSnipeVisible(false)} className="ml-auto shrink-0 text-stone-400 hover:text-white">
            ✕
          </button>
        </div>
      </div>

      {/* ── Legal confirmation dialog ─────────────────────────────────────── */}
      {pendingAmount !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-stone-900">{t.legalDialog.title}</h2>
            <p className="text-sm text-stone-600 leading-relaxed">{t.legalDialog.body}</p>
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-xl font-bold text-stone-900">
                {pendingAmount.toLocaleString('da-DK')} kr
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPendingAmount(null)}
                  className="px-4 py-2 text-sm font-medium text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  {t.legalDialog.cancel}
                </button>
                <button
                  onClick={confirmBid}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t.placing}
                    </span>
                  ) : t.legalDialog.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* ── Current bid panel ─────────────────────────────────────────────── */}
        <div className="border border-stone-200 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <PriceDisplay price={currentPrice} label={t.currentBid} size="lg" />
            {isAuctionActive && (
              <AuctionCountdown endDate={auctionEndDate} className="mt-1" />
            )}
          </div>

          {bids.length > 0 && (
            <p className="text-xs text-stone-400 mt-2 pl-4">
              {bids.length} {bids.length === 1 ? dict.cars.card.bid : dict.cars.card.bids}
            </p>
          )}

          {reservePrice != null && isAuctionActive && (
            <div className="mt-3 pl-4">
              {currentPrice >= reservePrice ? (
                <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  {t.reserveMet}
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded">
                  {t.reserveNotMet}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Place bid form ────────────────────────────────────────────────── */}
        {session && isAuctionActive && !isOwner && (
          <div className="border border-stone-200 rounded-xl p-5">
            <h3 className="font-semibold text-stone-900 mb-4">{t.placeBid}</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">{success}</div>
            )}

            <p className="text-xs text-stone-400 mb-3">
              {t.minimumBid}:{' '}
              <span className="font-semibold text-stone-700">{minNextBid.toLocaleString('da-DK')} kr</span>
              {bidIncrement && bidIncrement > 0 && (
                <span className="text-stone-300"> · {t.increment}: {bidIncrement.toLocaleString('da-DK')} kr</span>
              )}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="bidAmount" className="block text-xs font-medium text-stone-600 mb-1">
                  {t.yourBidLabel}
                </label>
                <input
                  id="bidAmount"
                  type="number"
                  step="1"
                  min={minNextBid}
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  placeholder={`min. ${minNextBid.toLocaleString('da-DK')} kr`}
                  required
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-stone-900 text-white text-sm font-semibold rounded-lg hover:bg-stone-800 transition-colors"
              >
                {t.submit}
              </button>
            </form>
          </div>
        )}

        {/* ── Proxy bid form ────────────────────────────────────────────────── */}
        {session && isAuctionActive && !isOwner && (
          <div className="border border-stone-200 rounded-xl p-5">
            <h3 className="font-semibold text-stone-900 mb-1">{t.proxyBid.title}</h3>
            <p className="text-xs text-stone-400 mb-4">{t.proxyBid.description}</p>
            {proxyError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{proxyError}</div>
            )}
            {proxySuccess && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">{proxySuccess}</div>
            )}
            <form onSubmit={handleProxySubmit} className="flex gap-2">
              <input
                type="number"
                step="1"
                min={minNextBid}
                value={proxyMax}
                onChange={e => setProxyMax(e.target.value)}
                placeholder={`${t.proxyBid.placeholder} (> ${currentPrice.toLocaleString('da-DK')} kr)`}
                required
                className="flex-1 px-4 py-2.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
              />
              <button
                type="submit"
                disabled={proxyPending}
                className="px-4 py-2.5 text-sm font-semibold bg-stone-100 text-stone-900 rounded-lg hover:bg-stone-200 transition-colors disabled:opacity-50"
              >
                {proxyPending ? t.proxyBid.submitting : t.proxyBid.submit}
              </button>
            </form>
          </div>
        )}

        {/* ── State messages ────────────────────────────────────────────────── */}
        {!session && isAuctionActive && (
          <div className="border border-stone-200 rounded-xl p-4 text-center">
            <p className="text-sm text-stone-500">{t.signInRequired}</p>
          </div>
        )}
        {isOwner && (
          <div className="border border-stone-200 rounded-xl p-4 text-center">
            <p className="text-sm text-stone-400">{t.ownerCannotBid}</p>
          </div>
        )}
        {!isAuctionActive && status === 'active' && (
          <div className="border border-stone-100 rounded-xl p-4 text-center bg-stone-50">
            <p className="text-sm text-stone-500">{t.auctionEnded}</p>
          </div>
        )}
        {status === 'completed' && (
          <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 text-center">
            <p className="font-semibold text-emerald-800">{t.status.completed}</p>
            <p className="text-xs text-emerald-600 mt-1">{t.status.completedBody}</p>
          </div>
        )}
        {status === 'reserve_not_met' && (
          <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 text-center">
            <p className="font-semibold text-amber-800">{t.status.reserveNotMet}</p>
            <p className="text-xs text-amber-600 mt-1">{t.status.reserveNotMetBody}</p>
          </div>
        )}
        {status === 'cancelled' && (
          <div className="border border-red-200 bg-red-50 rounded-xl p-4 text-center">
            <p className="font-semibold text-red-800">{t.status.cancelled}</p>
            <p className="text-xs text-red-600 mt-1">{t.status.cancelledBody}</p>
          </div>
        )}

        {/* ── Bid history (owner/admin only) ────────────────────────────────── */}
        {canSeeBidHistory && (
          <div className="border border-stone-200 rounded-xl p-5">
            <h3 className="font-semibold text-stone-900 mb-4">{t.history.title}</h3>
            {isLoading ? (
              <p className="text-sm text-stone-400 text-center py-4">{t.history.loading}</p>
            ) : bids.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-4">{t.history.empty}</p>
            ) : (
              <div className="space-y-2">
                {bids.map((bid, i) => (
                  <div
                    key={bid.id}
                    className={`flex justify-between items-center px-4 py-3 rounded-lg text-sm ${
                      i === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-stone-50'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-stone-900">{bid.amount.toLocaleString('da-DK')} kr</span>
                      {i === 0 && (
                        <span className="ml-2 text-xs bg-emerald-700 text-white px-1.5 py-0.5 rounded">
                          {t.history.leading}
                        </span>
                      )}
                      <p className="text-xs text-stone-400 mt-0.5">
                        {bid.bidder.name ?? 'Anonym'} · {new Date(bid.createdAt as unknown as string).toLocaleString('da-DK')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
