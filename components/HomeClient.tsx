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

export type TopCar = AuctionCar

interface HomeClientProps {
  locale: string
  isSignedIn: boolean
  userType?: 'PRIVATE' | 'BUSINESS'
  privateCars: AuctionCar[]
  businessCars: AuctionCar[]
}

export function HomeClient({ locale, isSignedIn, userType, privateCars, businessCars }: HomeClientProps) {
  const allCars = [...privateCars, ...businessCars]

  return (
    <main>
      {/* 1. Hero */}
      <HeroSection locale={locale} isSignedIn={isSignedIn} userType={userType} />

      {/* 2. Feature boxes */}
      <FeatureBoxesSection />

      {/* 3. About */}
      <AboutSection locale={locale} topCars={allCars} />

      {/* 4–5. How it works steps — skip for logged-in users who already know */}
      {!isSignedIn && <BuyersStepsSection locale={locale} />}
      {!isSignedIn && <SellersStepsSection locale={locale} />}

      {/* 6. Private vs Business signup cards — only for non-logged-in */}
      {!isSignedIn && <SellerTypeSection locale={locale} />}

      {/* 7. Private auctions — hidden for BUSINESS users */}
      {userType !== 'BUSINESS' && privateCars.length > 0 && (
        <AuctionTypeSection
          locale={locale}
          label="For Private"
          heading="Private Auktioner"
          subtext="Køb bil direkte fra private sælgere"
          cars={privateCars}
          viewAllHref={`/${locale}/cars?segment=private`}
        />
      )}

      {/* 8. Business auctions — hidden for PRIVATE users */}
      {userType !== 'PRIVATE' && businessCars.length > 0 && (
        <AuctionTypeSection
          locale={locale}
          label="For Erhverv"
          heading="Erhvervsauktioner"
          subtext="Professionelle forhandlere og virksomheder"
          cars={businessCars}
          viewAllHref={`/${locale}/cars?segment=business`}
          dark
        />
      )}

      {/* 9. FAQ preview */}
      <FaqPreviewSection locale={locale} />

      {/* 10. Final CTA */}
      <FinalCtaSection locale={locale} />

      <NewsletterAndFooter locale={locale} />
    </main>
  )
}
