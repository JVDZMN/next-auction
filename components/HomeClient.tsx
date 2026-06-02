'use client'

import dynamic from 'next/dynamic'
import { HeroSection }          from './home/HeroSection'
import { FeatureBoxesSection }  from './home/FeatureBoxesSection'
import { AboutSection }         from './home/AboutSection'
import { BuyersStepsSection }   from './home/BuyersStepsSection'
import { SellersStepsSection }  from './home/SellersStepsSection'
import { SellerTypeSection }    from './home/SellerTypeSection'
import { FaqPreviewSection }    from './home/FaqPreviewSection'
import { FinalCtaSection }      from './home/FinalCtaSection'

// Below-fold sections loaded after above-the-fold paint
const SlideshowSection    = dynamic(() => import('./home/SlideshowSection').then(m => ({ default: m.SlideshowSection })))
const NewsletterAndFooter = dynamic(() => import('./home/NewsletterAndFooter').then(m => ({ default: m.NewsletterAndFooter })))

export interface TopCar {
  id: string
  year: number
  brand: string
  model: string
  subModel: string | null
  images: string[]
  currentPrice: number
  auctionEndDate: string
  bidCount: number
}

interface HomeClientProps {
  locale: string
  isSignedIn: boolean
  topCars: TopCar[]
  showcaseImage: string | null
  brandCounts: Record<string, number>
  activeBrands: string[]
}

export function HomeClient({
  locale,
  isSignedIn,
  topCars,
}: HomeClientProps) {
  return (
    <main>
      {/* 1. Hero — dark navy + diagonal copper */}
      <HeroSection locale={locale} isSignedIn={isSignedIn} />

      {/* 2. Feature boxes bar */}
      <FeatureBoxesSection />

      {/* 3. About — split layout */}
      <AboutSection locale={locale} topCars={topCars} />

      {/* 4. How it works — Buyers */}
      <BuyersStepsSection locale={locale} />

      {/* 5. How it works — Sellers */}
      <SellersStepsSection locale={locale} />

      {/* 6. Private vs Business */}
      <SellerTypeSection locale={locale} />

      {/* 7. Active Auctions carousel */}
      <SlideshowSection topCars={topCars} locale={locale} />

      {/* 8. FAQ accordion preview */}
      <FaqPreviewSection locale={locale} />

      {/* 9. Final CTA */}
      <FinalCtaSection locale={locale} />

      {/* Footer */}
      <NewsletterAndFooter locale={locale} />
    </main>
  )
}
