'use client'

import dynamic from 'next/dynamic'
import { HeroSection }   from './home/HeroSection'
import { WelcomeSection } from './home/WelcomeSection'

// Below-fold sections — loaded after hero and welcome are painted
const BrandCarousel      = dynamic(() => import('./home/BrandCarousel').then(m => ({ default: m.BrandCarousel })))
const SlideshowSection   = dynamic(() => import('./home/SlideshowSection').then(m => ({ default: m.SlideshowSection })))
const WorkflowSection    = dynamic(() => import('./home/WorkflowSection').then(m => ({ default: m.WorkflowSection })))
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

export function HomeClient({ locale, isSignedIn, topCars, showcaseImage, brandCounts, activeBrands }: HomeClientProps) {
  return (
    <main>
      <HeroSection           locale={locale} isSignedIn={isSignedIn} />
      <WelcomeSection        locale={locale} showcaseImage={showcaseImage} />
      <BrandCarousel         locale={locale} brandCounts={brandCounts} activeBrands={activeBrands} />
      <SlideshowSection      topCars={topCars} locale={locale} />
      <WorkflowSection       locale={locale} />
      <NewsletterAndFooter   locale={locale} />
    </main>
  )
}
