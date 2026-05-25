'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { SP, SPX } from './constants'
import { useDict } from '@/lib/i18n/context'

const BRANDS_PER_PAGE = 12

const cardVariants = {
  idle:  { scale: 1,    y: 0,  backgroundColor: 'rgba(255,255,255,0.10)' },
  hover: { scale: 1.07, y: -7, backgroundColor: 'rgba(255,255,255,0.22)' },
}
const badgeVariants = {
  idle:  { scale: 0.90, y: 0  },
  hover: { scale: 1.10, y: -2 },
}

function BrandCard({ name, count, locale }: { name: string; count: number; locale: string }) {
  const router = useRouter()
  return (
    <motion.button
      onClick={() => router.push(`/${locale}/cars?brand=${encodeURIComponent(name)}`)}
      variants={cardVariants}
      initial="idle"
      whileHover="hover"
      whileTap={{ scale: 0.95 }}
      transition={SP}
      className="group relative flex flex-col items-center justify-center w-full h-27.5 rounded-xl cursor-pointer focus:outline-none"
      style={{ border: '1px solid rgba(255,255,255,0.22)', boxShadow: '0 4px 24px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.14)' }}
      aria-label={`Browse ${name} auctions`}
    >
      {count > 0 && (
        <motion.span
          variants={badgeVariants}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute top-0 right-0 z-50 flex min-h-6 min-w-6 translate-x-1/3 -translate-y-1/3 items-center justify-center rounded-full px-2 text-[11px] font-black leading-none text-white tabular-nums"
          style={{ backgroundColor: 'var(--copper)', boxShadow: `0 0 0 2px ${'var(--dark-section)'}, 0 3px 10px rgba(0,0,0,0.45)` }}
        >
          {count}
        </motion.span>
      )}
      <div className="flex h-11 w-18.75 items-center justify-center">
        <Image src={`/car-brands-icons/${name}.png`} alt={name} width={70} height={44} className="max-h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
      </div>
      <span
        className="mt-2.5 text-[9px] font-bold uppercase tracking-[0.15em] transition-colors duration-300"
        style={{ color: 'rgba(255,255,255,0.35)' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)')}
      >
        {name}
      </span>
    </motion.button>
  )
}

interface Props {
  locale: string
  brandCounts: Record<string, number>
  activeBrands: string[]
}

export function BrandCarousel({ locale, brandCounts, activeBrands }: Props) {
  const t = useDict().home.brands
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(activeBrands.length / BRANDS_PER_PAGE))
  const pageBrands  = activeBrands.slice(page * BRANDS_PER_PAGE, (page + 1) * BRANDS_PER_PAGE)

  return (
    <section className="min-h-screen w-full overflow-hidden flex flex-col items-center justify-center py-16 sm:py-20" style={{ backgroundColor: 'var(--dark-section)' }}>
      <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={SPX} className="mb-10 w-full max-w-7xl px-4 sm:px-8 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>{t.label}</p>
        <h2 className="text-3xl font-black sm:text-4xl" style={{ color: 'var(--text-light)' }}>{t.heading}</h2>
      </motion.div>

      <div className="w-full max-w-7xl px-4 sm:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="grid grid-cols-3 gap-4 sm:gap-5 md:grid-cols-4 lg:grid-cols-6"
          >
            {pageBrands.map(brand => (
              <BrandCard key={brand} name={brand} count={brandCounts[brand] ?? 0} locale={locale} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="mt-10 flex items-center gap-2.5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setPage(i)}
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.85 }}
              transition={SP}
              className="rounded-full focus:outline-none"
              style={{ height: 8, width: i === page ? 24 : 8, backgroundColor: i === page ? 'var(--copper)' : 'rgba(255,255,255,0.19)', transition: 'width 0.3s ease, background-color 0.3s ease' }}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
