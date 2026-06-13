'use client'

import Link from 'next/link'
import { TopFilterBar } from './home/TopFilterBar'
import { FeaturedAuctionCard } from './home/FeaturedAuctionCard'
import { AuctionGrid } from './home/AuctionGrid'
import { NewsletterSection } from './home/NewsletterAndFooter'
import { useDict, useLocale } from '@/lib/i18n/context'
import { useReveal } from '@/lib/useReveal'
import type { AuctionRow, SortMode } from '@/lib/auction-queries'

interface Props {
  isSignedIn: boolean
  featured: AuctionRow | null
  bySort: Record<SortMode, AuctionRow[]>
  carsHref: string
  locale: string
}

export function HomeMarketplace({ locale, isSignedIn, featured, bySort, carsHref }: Props) {
  useReveal()
  const t = useDict().home.marketplace

  return (
    <main>
      {/* 1. Quick-filter strip (sticky below header) */}
      <TopFilterBar />

      {/* 2. Featured auction hero card */}
      {featured && <FeaturedAuctionCard car={featured} />}

      {/* 3. Auction grid with sort tabs */}
      <AuctionGrid bySort={bySort} locale={locale} carsHref={carsHref} />

      {/* 4. Low-emphasis "how it works" link */}
      <div
        className="border-t py-6 text-center"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--page-bg)' }}
      >
        <Link
          href={`/${locale}/sadan-virker-det`}
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          {t.learnMore}
        </Link>
      </div>

      <NewsletterSection />
    </main>
  )
}
