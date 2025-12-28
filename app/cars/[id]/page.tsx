'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { BiddingSection } from '@/components/BiddingSection'
import { useSession } from 'next-auth/react'

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
    name: string
    email: string
    rating: number
  }
  bids: Array<{
    id: string
    amount: number
    createdAt: string
    bidder: {
      name: string
    }
  }>
}

export default function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { id } = use(params)
  const [car, setCar] = useState<Car | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCar()
  }, [id])

  const fetchCar = async () => {
    try {
      const response = await fetch(`/api/cars/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch car')
      }

      const data = await response.json()
      setCar(data)
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

  if (error || !car) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center text-red-600">
            {error || 'Car not found'}
          </div>
        </main>
      </div>
    )
  }

  const isOwner = session?.user?.id === car.owner.id
  const auctionEnded = new Date(car.auctionEndDate) < new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Images Gallery */}
          {car.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4">
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

          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {car.year} {car.brand} {car.model}
                </h1>
                <p className="text-gray-600 mt-1">
                  Listed by {car.owner.name} (⭐ {car.owner.rating.toFixed(1)})
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Price</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${car.currentPrice.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded">
              <div>
                <p className="text-sm text-gray-600">Year</p>
                <p className="font-semibold">{car.year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kilometers</p>
                <p className="font-semibold">{car.km.toLocaleString()} km</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Power</p>
                <p className="font-semibold">{car.power} HP</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Condition</p>
                <p className="font-semibold capitalize">{car.condition}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fuel</p>
                <p className="font-semibold">{car.fuel}</p>
              </div>
              {car.euroStandard && (
                <div>
                  <p className="text-sm text-gray-600">Euro Standard</p>
                  <p className="font-semibold uppercase">{car.euroStandard}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Starting Price</p>
                <p className="font-semibold">${car.startingPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Auction Ends</p>
                <p className="font-semibold">
                  {new Date(car.auctionEndDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Description */}
            {car.description && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{car.description}</p>
              </div>
            )}

            {/* Additional Notes */}
            {car.specs && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Additional Notes</h2>
                <p className="text-gray-700 whitespace-pre-line">{car.specs}</p>
              </div>
            )}

            {/* Bidding Section */}
            <div className="border-t pt-6">
              <BiddingSection
                carId={car.id}
                currentPrice={car.currentPrice}
                auctionEndDate={car.auctionEndDate}
                status={car.status}
                ownerId={car.owner.id}
                onBidPlaced={fetchCar}
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => router.back()}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              {isOwner && (
                <button
                  onClick={() => alert('Edit functionality coming soon')}
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors"
                >
                  Edit Listing
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
