'use client'

import dynamic from 'next/dynamic'
import { HeroSection }       from './home/HeroSection'
import { HowItWorksSection } from './home/HowItWorksSection'
import { AuctionTypeSection } from './home/AuctionTypeSection'
import type { AuctionCar }   from './home/AuctionTypeSection'
import { SellerTypeSection } from './home/SellerTypeSection'
import { FaqPreviewSection } from './home/FaqPreviewSection'
import { FinalCtaSection }   from './home/FinalCtaSection'

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
  return (
    <main>
      {/* 1. Hero — two-column, light bg, hero-cars.png */}
      <HeroSection locale={locale} isSignedIn={isSignedIn} userType={userType} />

      {/* 2. How it works — 4 steps, step 02 copper */}
      <HowItWorksSection />

      {/* 3. Active auctions — filtered by userType */}
      {userType !== 'BUSINESS' && privateCars.length > 0 && (
        <AuctionTypeSection
          locale={locale}
          label="Aktive Auktioner"
          heading="Find Din Næste Bil"
          subtext="Køb bil direkte fra private sælgere"
          cars={privateCars}
          viewAllHref={`/${locale}/cars?segment=private`}
        />
      )}
      {userType !== 'PRIVATE' && businessCars.length > 0 && (
        <AuctionTypeSection
          locale={locale}
          label="Erhvervsauktioner"
          heading="Professionelle Forhandlere"
          subtext="Godkendte erhvervsforhandlere og virksomheder"
          cars={businessCars}
          viewAllHref={`/${locale}/cars?segment=business`}
          dark
        />
      )}
      {/* Logged-out: show all available cars */}
      {!isSignedIn && privateCars.length === 0 && businessCars.length === 0 && (
        <div />
      )}

      {/* 4. Private vs Business — only for non-logged-in */}
      {!isSignedIn && <SellerTypeSection locale={locale} />}

      {/* 5. FAQ preview */}
      <FaqPreviewSection locale={locale} />

      {/* 6. Final CTA */}
      <FinalCtaSection locale={locale} />

      <NewsletterAndFooter locale={locale} />
    </main>
  )
}
