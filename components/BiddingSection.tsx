'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Bid {
  id: string
  amount: number
  createdAt: string
  bidder: {
    id: string
    name: string | null
    email: string
    rating: number
  }
}

interface BiddingSectionProps {
  carId: string
  currentPrice: number
  auctionEndDate: string
  status: string
  ownerId: string
  onBidPlaced?: () => void
}

export function BiddingSection({
  carId,
  currentPrice,
  auctionEndDate,
  status,
  ownerId,
  onBidPlaced,
}: BiddingSectionProps) {
  const { data: session } = useSession()
  const [bids, setBids] = useState<Bid[]>([])
  const [bidAmount, setBidAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
        setBids(data)
      }
    } catch (err) {
      console.error('Error fetching bids:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      const amount = parseFloat(bidAmount)
      if (isNaN(amount) || amount <= currentPrice) {
        setError(`Bid must be higher than $${currentPrice.toFixed(2)}`)
        setIsSubmitting(false)
        return
      }

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
    } finally {
      setIsSubmitting(false)
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
      </div>

      {/* Place Bid Form */}
      {session && isAuctionActive && !isOwner && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Place Your Bid</h3>
          
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Your Bid ($)
              </label>
              <input
                id="bidAmount"
                type="number"
                step="0.01"
                min={currentPrice + 0.01}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Minimum: $${(currentPrice + 0.01).toFixed(2)}`}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
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

      {/* Bid History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
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
                    {bid.bidder.name || 'Anonymous'} • {formatDate(bid.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    ⭐ {bid.bidder.rating.toFixed(1)}
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
