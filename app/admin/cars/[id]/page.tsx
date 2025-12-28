'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'

interface Car {
  id: string
  brand: string
  model: string
  description: string
  specs: string | null
  condition: string
  km: number
  year: number
  power: number
  fuel: string
  euroStandard: string | null
  images: string[]
  startingPrice: number
  currentPrice: number
  reservePrice: number | null
  auctionEndDate: string
  status: string
  createdAt: string
  owner: {
    id: string
    name: string | null
    email: string
    rating: number
    ratingCount: number
    createdAt: string
  }
  bids: Array<{
    id: string
    amount: number
    createdAt: string
    bidder: {
      id: string
      name: string | null
      email: string
      rating: number
      ratingCount: number
      _count: {
        bids: number
        cars: number
      }
    }
  }>
}

interface BidStats {
  totalBids: number
  uniqueBidders: number
  highestBid: number | null
  lowestBid: number | null
  averageBid: number | null
}

export default function AdminCarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [data, setData] = useState<{ car: Car; bidStats: BidStats } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/cars/${id}`)
      
      if (response.status === 403) {
        setError('Access denied. Admin privileges required.')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center text-red-600">
            {error || 'Failed to load car details'}
          </div>
        </main>
      </div>
    )
  }

  const { car, bidStats } = data
  const auctionEnded = new Date(car.auctionEndDate) < new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Car Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">
              {car.year} {car.brand} {car.model}
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <span className={`px-3 py-1 rounded ${
                car.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                {car.status.toUpperCase()}
              </span>
              <span>ID: {car.id}</span>
              <span>{auctionEnded ? 'Auction Ended' : 'Active Auction'}</span>
            </div>
          </div>

          {/* Images */}
          {car.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-gray-50">
              {car.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${car.brand} ${car.model} ${index + 1}`}
                  className="w-full h-48 object-cover rounded"
                />
              ))}
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Pricing Information */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600">Starting Price</p>
                <p className="text-xl font-bold">${car.startingPrice.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600">Current Price</p>
                <p className="text-xl font-bold text-green-600">${car.currentPrice.toLocaleString()}</p>
              </div>
              {car.reservePrice && (
                <div className="bg-yellow-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Reserve Price</p>
                  <p className="text-xl font-bold">${car.reservePrice.toLocaleString()}</p>
                </div>
              )}
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600">Auction Ends</p>
                <p className="text-sm font-semibold">{new Date(car.auctionEndDate).toLocaleString()}</p>
              </div>
            </div>

            {/* Bid Statistics */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4">Bid Statistics</h2>
              <div className="grid md:grid-cols-5 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Total Bids</p>
                  <p className="text-2xl font-bold">{bidStats.totalBids}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Unique Bidders</p>
                  <p className="text-2xl font-bold">{bidStats.uniqueBidders}</p>
                </div>
                {bidStats.highestBid && (
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Highest Bid</p>
                    <p className="text-xl font-bold text-green-600">${bidStats.highestBid.toLocaleString()}</p>
                  </div>
                )}
                {bidStats.lowestBid && (
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Lowest Bid</p>
                    <p className="text-xl font-bold">${bidStats.lowestBid.toLocaleString()}</p>
                  </div>
                )}
                {bidStats.averageBid && (
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Average Bid</p>
                    <p className="text-xl font-bold">${bidStats.averageBid.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Owner Information */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4">Owner Information</h2>
              <div className="bg-gray-50 p-4 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-lg">{car.owner.name || 'Anonymous'}</p>
                    <p className="text-gray-600">{car.owner.email}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Member since {new Date(car.owner.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">⭐ {car.owner.rating.toFixed(1)}</p>
                    <p className="text-sm text-gray-600">{car.owner.ratingCount} ratings</p>
                  </div>
                </div>
              </div>
            </div>

            {/* All Bidders */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4">All Bidders ({car.bids.length} bids)</h2>
              {car.bids.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No bids yet</p>
              ) : (
                <div className="space-y-3">
                  {car.bids.map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`p-4 rounded border ${
                        index === 0 
                          ? 'bg-green-50 border-green-300' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {index === 0 && (
                              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-semibold">
                                WINNING BID
                              </span>
                            )}
                            <span className="text-gray-500">#{index + 1}</span>
                          </div>
                          <p className="font-semibold text-lg">{bid.bidder.name || 'Anonymous'}</p>
                          <p className="text-sm text-gray-600">{bid.bidder.email}</p>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span>⭐ {bid.bidder.rating.toFixed(1)} ({bid.bidder.ratingCount} ratings)</span>
                            <span>📦 {bid.bidder._count.cars} cars listed</span>
                            <span>💰 {bid.bidder._count.bids} total bids</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(bid.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ${bid.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Car Specifications */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4">Specifications</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Year</p>
                  <p className="font-semibold">{car.year}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Kilometers</p>
                  <p className="font-semibold">{car.km.toLocaleString()} km</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Power</p>
                  <p className="font-semibold">{car.power} HP</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Condition</p>
                  <p className="font-semibold capitalize">{car.condition}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Fuel Type</p>
                  <p className="font-semibold">{car.fuel}</p>
                </div>
                {car.euroStandard && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Euro Standard</p>
                    <p className="font-semibold uppercase">{car.euroStandard}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {car.description && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-bold mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{car.description}</p>
              </div>
            )}

            {/* Additional Notes */}
            {car.specs && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-bold mb-2">Additional Notes</h2>
                <p className="text-gray-700 whitespace-pre-line">{car.specs}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
