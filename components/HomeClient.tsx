'use client'

import { HeroSection }       from './home/HeroSection'
import { NewsletterSection } from './home/NewsletterAndFooter'
import { HowItWorksSection } from './home/HowItWorksSection'
import { AuctionTypeSection } from './home/AuctionTypeSection'
import type { AuctionCar }   from './home/AuctionTypeSection'
import { SellerTypeSection } from './home/SellerTypeSection'
import { FaqPreviewSection } from './home/FaqPreviewSection'
import { FinalCtaSection }   from './home/FinalCtaSection'
import { useDict } from '@/lib/i18n/context'
import { useReveal } from '@/lib/useReveal'

export type TopCar = AuctionCar

interface HomeClientProps {
  locale: string
  isSignedIn: boolean
  role?: string
  privateCars: AuctionCar[]
  businessCars: AuctionCar[]
}

export function HomeClient({ locale, isSignedIn, role, privateCars, businessCars }: HomeClientProps) {
  useReveal()
  const t = useDict().home.auctionTypes

  return (
    <main>
      {/* 1. Hero — two-column, light bg, hero-cars.png */}
      <HeroSection locale={locale} isSignedIn={isSignedIn} role={role} />

      {/* 2. How it works — 4 steps, step 02 copper */}
      <HowItWorksSection />

      {/* 3. Active auctions — filtered by role */}
      {role !== 'BUSINESS_USER' && privateCars.length > 0 && (
        <AuctionTypeSection
          locale={locale}
          label={t.privateLabel}
          heading={t.privateHeading}
          subtext={t.privateSubtext}
          cars={privateCars}
          viewAllHref={`/${locale}/cars?segment=private`}
        />
      )}
      {role !== 'PRIVATE_USER' && businessCars.length > 0 && (
        <AuctionTypeSection
          locale={locale}
          label={t.businessLabel}
          heading={t.businessHeading}
          subtext={t.businessSubtext}
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

      <NewsletterSection />
    </main>
  )
}
