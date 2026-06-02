'use client'

import dynamic from 'next/dynamic'
import { HeroSection }          from './home/HeroSection'
import { FeatureBoxesSection }  from './home/FeatureBoxesSection'
import { AboutSection }         from './home/AboutSection'
import { BuyersStepsSection }   from './home/BuyersStepsSection'
import { SellersStepsSection }  from './home/SellersStepsSection'
import { SellerTypeSection }    from './home/SellerTypeSection'
import { AuctionTypeSection }   from './home/AuctionTypeSection'
import type { AuctionCar }      from './home/AuctionTypeSection'
import { FaqPreviewSection }    from './home/FaqPreviewSection'
import { FinalCtaSection }      from './home/FinalCtaSection'

const NewsletterAndFooter = dynamic(() => import('./home/NewsletterAndFooter').then(m => ({ default: m.NewsletterAndFooter })))

// Re-export for AboutSection (uses car images)
export interface TopCar extends AuctionCar {}

interface HomeClientProps {
  locale: string
  isSignedIn: boolean
  privateCars: AuctionCar[]
  businessCars: AuctionCar[]
}

export function HomeClient({ locale, isSignedIn, privateCars, businessCars }: HomeClientProps) {
  // Merge all cars for the About section image grid
  const allCars = [...privateCars, ...businessCars]

  return (
    <main>
      {/* 1. Hero */}
      <HeroSection locale={locale} isSignedIn={isSignedIn} />

      {/* 2. Feature boxes */}
      <FeatureBoxesSection />

      {/* 3. About */}
      <AboutSection locale={locale} topCars={allCars} />

      {/* 4. How it works — Buyers */}
      <BuyersStepsSection locale={locale} />

      {/* 5. How it works — Sellers */}
      <SellersStepsSection locale={locale} />

      {/* 6. Private vs Business cards */}
      <SellerTypeSection locale={locale} />

      {/* 7. Private auctions */}
      <AuctionTypeSection
        locale={locale}
        label="For Private"
        heading="Private Auktioner"
        subtext="Køb bil direkte fra private sælgere"
        cars={privateCars}
        viewAllHref={`/${locale}/cars?segment=private`}
      />

      {/* 8. Business auctions */}
      <AuctionTypeSection
        locale={locale}
        label="For Erhverv"
        heading="Erhvervsauktioner"
        subtext="Professionelle forhandlere og virksomheder"
        cars={businessCars}
        viewAllHref={`/${locale}/cars?segment=business`}
        dark
      />

      {/* 9. FAQ preview */}
      <FaqPreviewSection locale={locale} />

      {/* 10. Final CTA */}
      <FinalCtaSection locale={locale} />

      {/* Footer */}
      <NewsletterAndFooter locale={locale} />
    </main>
  )
}
