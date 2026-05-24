'use client'

import { HeroSection }          from './home/HeroSection'
import { WelcomeSection }       from './home/WelcomeSection'
import { BrandCarousel }        from './home/BrandCarousel'
import { SlideshowSection }     from './home/SlideshowSection'
import { WorkflowSection }      from './home/WorkflowSection'
import { NewsletterAndFooter }  from './home/NewsletterAndFooter'

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

export function HomeClient({ locale, isSignedIn, topCars, showcaseImage, brandCounts, activeBrands }: HomeClientProps) {
  return (
    <main>
      <HeroSection          locale={locale} isSignedIn={isSignedIn} />
      <WelcomeSection       locale={locale} showcaseImage={showcaseImage} />
      <BrandCarousel        locale={locale} brandCounts={brandCounts} activeBrands={activeBrands} />
      <SlideshowSection     topCars={topCars} locale={locale} />
      <WorkflowSection      locale={locale} />
      <NewsletterAndFooter  locale={locale} />
    </main>
  )
}
