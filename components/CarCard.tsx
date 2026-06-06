'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LikeButton } from '@/components/LikeButton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useLocale } from '@/lib/i18n/context'
import { cloudinaryBlurUrl } from '@/lib/cloudinary'
import { CarCardLivePrice } from '@/components/CarCardLivePrice'

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
  priority?: boolean
  owner: { name: string | null }
  ownerRole?: string
}

function getTimeRemaining(endDate: string | Date): { label: string; urgent: boolean } {
  const diff = new Date(endDate).getTime() - Date.now()
  if (diff <= 0) return { label: 'Ended', urgent: false }
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins  = Math.floor((diff % 3600000) / 60000)
  if (days  > 0) return { label: `${days}d ${hours}h`, urgent: days < 1 }
  if (hours > 0) return { label: `${hours}h ${mins}m`, urgent: true }
  return { label: `${mins}m`, urgent: true }
}

export function CarCard({ id, year, brand, model, subModel, images, condition, fuel, km, city, bodyType, currentPrice, auctionEndDate, bidCount, isLiked = false, priority = false, ownerRole }: CarCardProps) {
  const locale = useLocale()
  const router = useRouter()
  const { label, urgent } = getTimeRemaining(auctionEndDate)

  return (
    <div className="group relative block">
      {/* Like button — outside Link to avoid <button> inside <a> */}
      <div className="absolute top-2 right-2 z-10">
        <LikeButton carId={id} initialLiked={isLiked} />
      </div>

      <Link href={`/${locale}/cars/${id}`} className="block">
      <Card className="overflow-hidden rounded-[20px] bg-card-bg shadow-sm transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <div className="relative aspect-4/3 bg-muted">
          {images?.[0] ? (
            <Image
              src={images[0]}
              alt={`${year} ${brand} ${model}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
              placeholder="blur"
              blurDataURL={cloudinaryBlurUrl(images[0])}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No image</div>
          )}

          {/* Segment badge */}
          {ownerRole && (
            <Badge
              className="absolute bottom-2 right-2 text-[10px] font-bold text-white border-0"
              style={{ backgroundColor: ownerRole === 'BUSINESS_USER' ? 'var(--dark-section)' : 'var(--copper)' }}
            >
              {ownerRole === 'BUSINESS_USER' ? 'Erhverv' : 'Privat'}
            </Badge>
          )}

          {/* Time badge */}
          <Badge
            variant="secondary"
            className={`absolute top-2 left-2 gap-1 bg-white/90 backdrop-blur-sm ${urgent ? 'text-copper' : 'text-foreground'}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {label}
          </Badge>

          {/* Fuel / body type badges */}
          {(fuel || bodyType) && (
            <div className="absolute bottom-2 left-2 flex gap-1">
              {fuel     && <Badge variant="secondary" className="bg-white/90 text-foreground text-xs">{fuel}</Badge>}
              {bodyType && <Badge variant="secondary" className="bg-white/90 text-foreground text-xs">{bodyType}</Badge>}
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3 className="font-bold leading-tight line-clamp-1 text-sm">
              {year} {brand} {model}{subModel ? ` ${subModel}` : ''}
            </h3>
            <Badge variant="outline" className="shrink-0 text-xs capitalize">{condition}</Badge>
          </div>

          <div className="flex items-center gap-1 mb-1">
            <button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/${locale}/cars?brand=${encodeURIComponent(brand)}`) }}
              className="text-xs hover:underline transition-colors"
              style={{ color: 'var(--copper)' }}
            >
              {brand}
            </button>
            <span className="text-xs text-muted-foreground">·</span>
            <button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/${locale}/cars?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`) }}
              className="text-xs hover:underline transition-colors"
              style={{ color: 'var(--copper)' }}
            >
              {model}
            </button>
          </div>

          {(km != null || city) && (
            <p className="text-xs text-muted-foreground mb-2">
              {km != null ? `${km.toLocaleString('da-DK')} km` : ''}
              {km != null && city ? ' · ' : ''}
              {city ?? ''}
            </p>
          )}

          <CarCardLivePrice carId={id} initialPrice={currentPrice} initialBidCount={bidCount} />
        </CardContent>
      </Card>
      </Link>
    </div>
  )
}
