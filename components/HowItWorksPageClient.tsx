'use client'

import { HeroSection }       from './home/HeroSection'
import { HowItWorksSection } from './home/HowItWorksSection'
import { SellerTypeSection } from './home/SellerTypeSection'
import { FaqPreviewSection } from './home/FaqPreviewSection'
import { FinalCtaSection }   from './home/FinalCtaSection'
import { NewsletterSection } from './home/NewsletterAndFooter'
import { useReveal } from '@/lib/useReveal'

interface Props {
  locale: string
  isSignedIn: boolean
  role?: string
}

export function HowItWorksPageClient({ locale, isSignedIn, role }: Props) {
  useReveal()

  return (
    <main>
      <HeroSection locale={locale} isSignedIn={isSignedIn} role={role} />
      <HowItWorksSection />
      <SellerTypeSection locale={locale} />
      <FaqPreviewSection locale={locale} />
      <FinalCtaSection locale={locale} />
      <NewsletterSection />
    </main>
  )
}
