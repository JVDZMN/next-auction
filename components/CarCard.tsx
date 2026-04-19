import Image from 'next/image'
import Link from 'next/link'
import { LikeButton } from '@/components/LikeButton'

type Car = {
  id: string
  year: number
  brand: string
  model: string
  images: string[]
  condition: string
  currentPrice: number
  auctionEndDate: Date
  likeCount: number
  isLiked: boolean
  owner: { name: string | null }
  _count: { bids: number }
}

function getTimeRemaining(endDate: Date) {
  const diff = endDate.getTime() - new Date().getTime()
  if (diff <= 0) return 'Ended'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function CarCard({ car }: { car: Car }) {
  const timeLabel = getTimeRemaining(car.auctionEndDate)
  const ended = timeLabel === 'Ended'
  const diff = car.auctionEndDate.getTime() - new Date().getTime()
  const urgent = diff > 0 && diff < 1000 * 60 * 60 * 24

  return (
    <Link
      href={`/cars/${car.id}`}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
    >
      <div className="relative h-48 bg-gray-200">
        {car.images?.[0] ? (
          <Image
            src={car.images[0]}
            alt={`${car.year} ${car.brand} ${car.model}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No image
          </div>
        )}

        {/* Top-left: time remaining */}
        <div
          className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold ${ended || urgent ? 'text-red-500' : 'text-gray-700'}`}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {timeLabel}
        </div>

        {/* Top-right: like button */}
        <div className="absolute top-3 right-3">
          <LikeButton
            carId={car.id}
            initialLiked={car.isLiked}
          />
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-lg font-bold line-clamp-1">
            {car.brand} {car.model} {car.year}
          </h3>
          <span className="ml-2 shrink-0 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {car.condition}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          By {car.owner.name}
        </p>
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Current Bid</span>
            <span className="text-xl font-bold text-blue-600">
              ${car.currentPrice.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{car._count.bids} bids</span>
          </div>
        </div>
        <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          View & Bid
        </button>
      </div>
    </Link>
  )
}
