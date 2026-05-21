'use client'

type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void

interface Props {
  formData: {
    startingPrice: string
    reservePrice: string
    auctionEndDate: string
    auctionStartDate: string
    bidIncrement: string
  }
  onChange: ChangeHandler
}

export function CarAuctionSection({ formData, onChange }: Props) {
  const nowIso = new Date().toISOString().slice(0, 16)

  return (
    <>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="startingPrice" className="block text-sm font-medium text-gray-700 mb-1">Starting Price (kr)</label>
          <input
            id="startingPrice" name="startingPrice" type="number" required
            value={formData.startingPrice} onChange={onChange}
            placeholder="5000" min="0" step="0.01"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="reservePrice" className="block text-sm font-medium text-gray-700 mb-1">Reserve Price (kr, optional)</label>
          <input
            id="reservePrice" name="reservePrice" type="number"
            value={formData.reservePrice} onChange={onChange}
            placeholder="Optional" min="0" step="0.01"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="auctionEndDate" className="block text-sm font-medium text-gray-700 mb-1">Auction End Date</label>
          <input
            id="auctionEndDate" name="auctionEndDate" type="datetime-local" required
            value={formData.auctionEndDate} onChange={onChange} min={nowIso}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="auctionStartDate" className="block text-sm font-medium text-gray-700 mb-1">Auction Start Date (optional)</label>
          <input
            id="auctionStartDate" name="auctionStartDate" type="datetime-local"
            value={formData.auctionStartDate} onChange={onChange} min={nowIso}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="bidIncrement" className="block text-sm font-medium text-gray-700 mb-1">Minimum Bid Increment (kr, optional)</label>
          <input
            id="bidIncrement" name="bidIncrement" type="number"
            value={formData.bidIncrement} onChange={onChange}
            placeholder="e.g. 500" min="0" step="0.01"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
      </div>
    </>
  )
}
