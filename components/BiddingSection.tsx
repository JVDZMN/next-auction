'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { Prisma } from '@prisma/client'

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

  const isAuctionActive = status === 'active' && new Date(auctionEndDate) > new Date()
  const isOwner = session?.user?.email && ownerId === session.user.id

  useEffect(() => {
    fetchBids()
    // Poll for new bids every 5 seconds
    const interval = setInterval(fetchBids, 5000)
    return () => clearInterval(interval)
  }, [carId])

  const fetchBids = async () => {
    try {
      const response = await fetch(`/api/bids?carId=${carId}`)
      if (response.ok) {
        const data = await response.json()
        // Expecting { bids: BidWithBidder[] }
        setBids(data.bids || [])
      }
    } catch (err) {
      console.error('Error fetching bids:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const amount = parseFloat(bidAmount)
    if (isNaN(amount) || amount <= currentPrice) {
      setError(`Bid must be higher than $${currentPrice.toFixed(2)}`)
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/bids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ carId, amount }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to place bid')
        }

        setSuccess('Bid placed successfully!')
        setBidAmount('')
        fetchBids()
        onBidPlaced?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to place bid')
      }
    })
  }

  const minNextBid = bidIncrement && bidIncrement > 0
    ? currentPrice + bidIncrement
    : currentPrice + 1

  const handleProxySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProxyError(null)
    setProxySuccess(null)
    const max = parseFloat(proxyMax)
    if (isNaN(max) || max <= currentPrice) {
      setProxyError(`Max must be greater than current price $${currentPrice.toFixed(2)}`)
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
      setProxySuccess(`Proxy bid set — we'll bid for you up to $${max.toFixed(2)}`)
      setProxyMax('')
    } catch (err) {
      setProxyError(err instanceof Error ? err.message : 'Failed to set proxy bid')
    } finally {
      setProxyPending(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getTimeRemaining = () => {
    const end = new Date(auctionEndDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return 'Auction ended'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h remaining`
    if (hours > 0) return `${hours}h ${minutes}m remaining`
    return `${minutes}m remaining`
  }

  return (
    <div className="space-y-6">
      {/* Current Bid Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Current Bid</h3>
          <span className="text-sm text-gray-600">{getTimeRemaining()}</span>
        </div>
        <p className="text-3xl font-bold text-blue-600">${currentPrice.toFixed(2)}</p>
        {bids.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            {bids.length} bid{bids.length !== 1 ? 's' : ''}
          </p>
        )}
        {reservePrice != null && isAuctionActive && (
          currentPrice >= reservePrice ? (
            <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
              Reserve met
            </span>
          ) : (
            <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
              Reserve not yet met
            </span>
          )
        )}
      </div>

      {/* Place Bid Form */}
      {session && isAuctionActive && !isOwner && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Place Your Bid</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              {success}
            </div>
          )}

          <p className="text-sm text-gray-500 mb-2">
            Minimum next bid: <span className="font-semibold text-gray-800">${minNextBid.toFixed(2)}</span>
            {bidIncrement && bidIncrement > 0 && <span className="text-gray-400"> (increment: ${bidIncrement})</span>}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Your Bid ($)
              </label>
              <input
                id="bidAmount"
                type="number"
                step="0.01"
                min={minNextBid}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Minimum: $${minNextBid.toFixed(2)}`}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing Bid...
                </span>
              ) : (
                'Place Bid'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Proxy bid form */}
      {session && isAuctionActive && !isOwner && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-black mb-1">Set Proxy Bid</h3>
          <p className="text-sm text-gray-500 mb-4">We'll automatically bid for you up to your maximum.</p>
          {proxyError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{proxyError}</div>}
          {proxySuccess && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{proxySuccess}</div>}
          <form onSubmit={handleProxySubmit} className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min={minNextBid}
              value={proxyMax}
              onChange={(e) => setProxyMax(e.target.value)}
              placeholder={`Max amount (> $${currentPrice.toFixed(2)})`}
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm"
            />
            <button
              type="submit"
              disabled={proxyPending}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {proxyPending ? 'Saving...' : 'Set Max'}
            </button>
          </form>
        </div>
      )}

      {!session && isAuctionActive && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800">Please sign in to place a bid</p>
        </div>
      )}

      {isOwner && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">You cannot bid on your own listing</p>
        </div>
      )}

      {!isAuctionActive && status === 'active' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">Auction has ended</p>
        </div>
      )}

      {status === 'completed' && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-center">
          <p className="text-green-800 font-semibold text-lg">Auction Closed — Sold</p>
          <p className="text-green-700 text-sm mt-1">This auction has ended and a winner has been selected.</p>
        </div>
      )}

      {status === 'reserve_not_met' && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-center">
          <p className="text-yellow-800 font-semibold text-lg">Auction Closed — Reserve Not Met</p>
          <p className="text-yellow-700 text-sm mt-1">The auction ended but the reserve price was not reached.</p>
        </div>
      )}

      {status === 'cancelled' && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-center">
          <p className="text-red-800 font-semibold text-lg">Auction Cancelled</p>
          <p className="text-red-700 text-sm mt-1">This auction was cancelled.</p>
        </div>
      )}

      {/* Bid History */}
      <div className="bg-white border border-gray-200 text-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Bid History</h3>
        {isLoading ? (
          <p className="text-gray-500 text-center py-4">Loading bids...</p>
        ) : bids.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No bids yet. Be the first to bid!</p>
        ) : (
          <div className="space-y-3">
            {bids.map((bid, index) => (
              <div
                key={bid.id}
                className={`flex justify-between items-center p-3 rounded ${
                  index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    ${bid.amount.toFixed(2)}
                    {index === 0 && (
                      <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
                        Leading Bid
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {bid.bidder.name || 'Anonymous'} • {formatDate(bid.createdAt.toISOString().slice(0, 16))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
