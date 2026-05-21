'use client'

import Image from 'next/image'
import Link from 'next/link'
import { LikeButton } from '@/components/LikeButton'

type CarCardProps = {
  id: string
  year: number
  brand: string
  model: string
  subModel?: string | null
  images: string[]
  condition: string
  fuel?: string | null
  km?: number
  city?: string | null
  bodyType?: string | null
  currentPrice: number
  auctionEndDate: string | Date
  bidCount: number
  isLiked?: boolean
  owner: { name: string | null }
}

function getTimeRemaining(endDate: string | Date): { label: string; urgent: boolean } {
  const diff = new Date(endDate).getTime() - Date.now()
  if (diff <= 0) return { label: 'Ended', urgent: false }
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins  = Math.floor((diff % 3600000) / 60000)
  if (days  > 0)  return { label: `${days}d ${hours}h`,  urgent: days < 1 }
  if (hours > 0)  return { label: `${hours}h ${mins}m`,  urgent: true }
  return { label: `${mins}m`, urgent: true }
}

export function CarCard({ id, year, brand, model, subModel, images, condition, fuel, km, city, bodyType, currentPrice, auctionEndDate, bidCount, isLiked = false, owner }: CarCardProps) {
  const { label, urgent } = getTimeRemaining(auctionEndDate)

  return (
    <Link href={`/cars/${id}`} className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all overflow-hidden block">
      <div className="relative aspect-4/3 bg-gray-100">
        {images?.[0] ? (
          <Image
            src={images[0]}
            alt={`${year} ${brand} ${model}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">No image</div>
        )}

        {/* Time badge */}
        <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-white/90 rounded-full text-xs font-semibold ${urgent ? 'text-red-600' : 'text-gray-700'}`}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {label}
        </div>

        {/* Like button */}
        <div className="absolute top-2 right-2" onClick={e => e.preventDefault()}>
          <LikeButton carId={id} initialLiked={isLiked} />
        </div>

        {/* Fuel / body type badges */}
        {(fuel || bodyType) && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {fuel    && <span className="px-1.5 py-0.5 bg-white/90 text-gray-700 text-xs rounded">{fuel}</span>}
            {bodyType && <span className="px-1.5 py-0.5 bg-white/90 text-gray-700 text-xs rounded">{bodyType}</span>}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="font-bold text-gray-900 leading-tight line-clamp-1">
            {year} {brand} {model}{subModel ? ` ${subModel}` : ''}
          </h3>
          <span className="shrink-0 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded capitalize">{condition}</span>
        </div>

        {(km != null || city) && (
          <p className="text-xs text-gray-500 mb-2">
            {km != null ? `${km.toLocaleString('da-DK')} km` : ''}
            {km != null && city ? ' · ' : ''}
            {city ?? ''}
          </p>
        )}

        <div className="flex items-end justify-between border-t pt-3 mt-2">
          <div>
            <p className="text-xs text-gray-500">Current bid</p>
            <p className="text-lg font-bold text-blue-600">{currentPrice.toLocaleString('da-DK')} kr</p>
          </div>
          <p className="text-xs text-gray-500">{bidCount} {bidCount === 1 ? 'bid' : 'bids'}</p>
        </div>
      </div>
    </Link>
  )
}
