'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingPage, ErrorPage, PageLayout } from '@/components/PageLayout'
import { BiddingSection } from '@/components/BiddingSection'
import MessageSeller from '@/components/MessageSeller'
import { useSession } from 'next-auth/react'
import type { Car } from '@/types/car'

export default function CarDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter()
  const { data: session } = useSession()
  const resolvedParams = params instanceof Promise ? use(params) : params
  const { id } = resolvedParams
  const [car, setCar] = useState<Car | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [relisting, setRelisting] = useState(false)
  const [relistDate, setRelistDate] = useState('')
  const [showRelistForm, setShowRelistForm] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [notifyClose, setNotifyClose] = useState(false)

  useEffect(() => {
    fetchCar()
    // Track view (fire-and-forget)
    fetch(`/api/cars/${id}/view`, { method: 'POST' }).catch(() => {})
  }, [id])

  const fetchCar = async () => {
    try {
      const response = await fetch(`/api/cars/${id}`)
      if (!response.ok) throw new Error('Failed to fetch car')
      const data = await response.json()
      setCar(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingPage />
  if (error || !car) return <ErrorPage message={error || 'Car not found'} />

  const isOwner = session?.user?.id === car.owner.id

  const handleCancelAuction = async () => {
    if (!confirm('Are you sure you want to cancel this auction? This cannot be undone.')) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/cars/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) throw new Error()
      await fetchCar()
    } catch {
      alert('Failed to cancel auction. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const handleAcceptHighestBid = async () => {
    if (!confirm('Accept the highest bid and close this auction as sold?')) return
    setAccepting(true)
    try {
      const res = await fetch(`/api/cars/${id}/accept-bid`, { method: 'POST' })
      if (!res.ok) throw new Error()
      await fetchCar()
    } catch {
      alert('Failed to accept bid. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  const handleRelist = async () => {
    if (!relistDate) return
    setRelisting(true)
    try {
      const res = await fetch(`/api/cars/${id}/relist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionEndDate: new Date(relistDate).toISOString() }),
      })
      if (!res.ok) throw new Error()
      setShowRelistForm(false)
      await fetchCar()
    } catch {
      alert('Failed to relist. Please try again.')
    } finally {
      setRelisting(false)
    }
  }

  const handleDuplicate = async () => {
    setDuplicating(true)
    try {
      const res = await fetch(`/api/cars/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      router.push(`/cars/${data.id}`)
    } catch {
      alert('Failed to duplicate listing. Please try again.')
    } finally {
      setDuplicating(false)
    }
  }

  const handleNotifyToggle = async (checked: boolean) => {
    setNotifyClose(checked)
    await fetch(`/api/cars/${id}/like`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifyNearClose: checked }),
    }).catch(() => {})
  }

  return (
    <PageLayout>
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
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-600">Listed by {car.owner.name}</p>
                {car.owner.sellerVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    ✓ Verified Seller
                  </span>
                )}
              </div>
              {isOwner && (
                <p className="text-sm text-gray-400 mt-1">{car.views} view{car.views !== 1 ? 's' : ''}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Current Price</p>
              <p className="text-3xl font-bold text-blue-600">${car.currentPrice.toLocaleString()}</p>
            </div>
          </div>

          {/* Draft banner */}
          {car.isDraft && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-yellow-800 text-sm font-medium">
              This listing is a draft and not visible to other users.
            </div>
          )}

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded">
            <div><p className="text-sm text-gray-600">Year</p><p className="font-semibold">{car.year}</p></div>
            <div><p className="text-sm text-gray-600">Kilometers</p><p className="font-semibold">{car.km.toLocaleString()} km</p></div>
            <div><p className="text-sm text-gray-600">Power</p><p className="font-semibold">{car.power} HP</p></div>
            <div><p className="text-sm text-gray-600">Condition</p><p className="font-semibold capitalize">{car.condition}</p></div>
            <div><p className="text-sm text-gray-600">Fuel</p><p className="font-semibold">{car.fuel}</p></div>
            <div><p className="text-sm text-gray-600">Starting Price</p><p className="font-semibold">${car.startingPrice.toLocaleString()}</p></div>
            <div>
              <p className="text-sm text-gray-600">Auction Ends</p>
              <p className="font-semibold">{new Date(car.auctionEndDate).toLocaleDateString()}</p>
            </div>
            {car.bidIncrement && (
              <div><p className="text-sm text-gray-600">Bid Increment</p><p className="font-semibold">${car.bidIncrement.toLocaleString()}</p></div>
            )}
          </div>

          {/* Trust / Vehicle Info */}
          {(car.vin || car.inspectionReportUrl || car.serviceHistoryUrls?.length > 0) && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h2 className="text-lg font-bold mb-3">Vehicle Documentation</h2>
              <div className="space-y-2 text-sm">
                {car.vin && (
                  <p><span className="text-gray-500 font-medium">VIN:</span> <span className="font-mono">{car.vin}</span></p>
                )}
                {car.inspectionReportUrl && (
                  <p>
                    <span className="text-gray-500 font-medium">Inspection Report: </span>
                    <a href={car.inspectionReportUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Report</a>
                  </p>
                )}
                {car.serviceHistoryUrls?.length > 0 && (
                  <div>
                    <span className="text-gray-500 font-medium">Service History: </span>
                    {car.serviceHistoryUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mr-2">
                        Document {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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
              reservePrice={car.reservePrice}
              bidIncrement={car.bidIncrement}
              onBidPlaced={fetchCar}
            />
            {isOwner && car.status === 'reserve_not_met' && car.bids.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                <p className="text-yellow-800 font-semibold mb-1">Reserve not met</p>
                <p className="text-yellow-700 text-sm mb-3">
                  The highest bid was <strong>${car.currentPrice.toLocaleString()}</strong>. You can accept it and close the auction as sold.
                </p>
                <button
                  onClick={handleAcceptHighestBid}
                  disabled={accepting}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {accepting ? 'Processing...' : 'Accept Highest Bid'}
                </button>
              </div>
            )}

            {/* Watchlist near-close toggle (non-owners) */}
            {session && !isOwner && car.status === 'active' && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  id="notifyClose"
                  checked={notifyClose}
                  onChange={(e) => handleNotifyToggle(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="notifyClose">Email me when this auction is closing soon</label>
              </div>
            )}

            <MessageSeller carId={car.id} ownerId={car.owner.id} ownerName={car.owner.name || 'Seller'} />
          </div>

          {/* Relist form */}
          {isOwner && ['cancelled', 'reserve_not_met'].includes(car.status) && (
            <div className="mt-4">
              {showRelistForm ? (
                <div className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <p className="text-sm font-medium text-gray-700">New auction end date:</p>
                  <input
                    type="datetime-local"
                    value={relistDate}
                    onChange={(e) => setRelistDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded text-gray-900"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleRelist}
                      disabled={relisting || !relistDate}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {relisting ? 'Relisting...' : 'Confirm Relist'}
                    </button>
                    <button onClick={() => setShowRelistForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowRelistForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700"
                >
                  Relist Auction
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
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
            {isOwner && (
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="px-6 py-2 bg-gray-600 text-white font-semibold rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {duplicating ? 'Duplicating...' : 'Duplicate as Draft'}
              </button>
            )}
            {isOwner && car.status === 'active' && (
              <button
                onClick={handleCancelAuction}
                disabled={cancelling}
                className="px-6 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Auction'}
              </button>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
