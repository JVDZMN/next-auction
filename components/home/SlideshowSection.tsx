'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { SP, SPX } from './constants'
import type { TopCar } from '../HomeClient'

const VISIBLE = 3
const GAP     = 20
const TICK    = 10_000

function timeLeft(iso: string): { label: string; urgent: boolean } {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return { label: 'Ended', urgent: false }
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (d > 0) return { label: `${d}d ${h}h`, urgent: false }
  if (h > 0) return { label: `${h}h ${m}m`, urgent: true }
  return { label: `${m}m`, urgent: true }
}

function SlideCard({ car, locale, cw, idx }: { car: TopCar; locale: string; cw: number; idx: number }) {
  const tl = timeLeft(car.auctionEndDate)
  return (
    <motion.div
      className="shrink-0 overflow-hidden rounded-2xl"
      style={{ width: cw > 0 ? cw : '33%', backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 14px rgba(0,0,0,0.09)' }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SP, delay: idx * 0.04 }}
      whileHover={{ y: -5, boxShadow: '0 10px 32px rgba(0,0,0,0.15)' }}
    >
      <Link href={`/${locale}/cars/${car.id}`} className="block">
        <div className="relative overflow-hidden" style={{ aspectRatio: '16/10', backgroundColor: 'rgba(8,41,36,0.08)' }}>
          {car.images[0] ? (
            <Image src={car.images[0]} alt={`${car.year} ${car.brand} ${car.model}`} fill className="object-cover transition-transform duration-500" sizes="33vw" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg className="h-14 w-20 text-white/30" viewBox="0 0 120 48" fill="currentColor">
                <path d="M14 34 L20 24 L38 18 L60 16 L82 18 L98 24 L104 30 L108 34 L100 34 Q97 26 88 26 Q79 26 76 34 L44 34 Q41 26 32 26 Q23 26 20 34 Z" />
                <circle cx="30" cy="34" r="8" /><circle cx="90" cy="34" r="8" />
              </svg>
            </div>
          )}
          <div className="absolute right-3 top-3 rounded px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: 'var(--copper)' }}>
            {car.bidCount} bids
          </div>
        </div>
        <div className="p-4">
          <p className="truncate text-sm font-black" style={{ color: 'var(--text-body)' }}>{car.year} {car.brand} {car.model}</p>
          {car.subModel && <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--text-muted)' }}>{car.subModel}</p>}
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Current Bid</p>
              <p className="text-base font-bold" style={{ color: 'var(--copper)' }}>{car.currentPrice.toLocaleString('da-DK')} kr</p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ends in</p>
              <p className="text-sm font-semibold" style={{ color: tl.urgent ? '#DC2626' : 'var(--text-muted)' }}>{tl.label}</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

interface Props { topCars: TopCar[]; locale: string }

export function SlideshowSection({ topCars, locale }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cw, setCw]         = useState(0)
  const [offset, setOffset] = useState(0)
  const maxOffset = Math.max(0, topCars.length - VISIBLE)

  const recalc = useCallback(() => {
    if (containerRef.current) setCw((containerRef.current.offsetWidth - GAP * (VISIBLE - 1)) / VISIBLE)
  }, [])

  useEffect(() => { recalc(); window.addEventListener('resize', recalc); return () => window.removeEventListener('resize', recalc) }, [recalc])
  useEffect(() => {
    if (topCars.length <= VISIBLE) return
    const id = setInterval(() => setOffset(p => (p >= maxOffset ? 0 : p + 1)), TICK)
    return () => clearInterval(id)
  }, [topCars.length, maxOffset])

  if (topCars.length === 0) return null

  return (
    <section className="min-h-screen flex flex-col justify-center py-16 sm:py-20" style={{ backgroundColor: 'var(--page-bg)' }}>
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={SPX} className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>Most Active</p>
            <h2 className="text-3xl font-black sm:text-4xl" style={{ color: 'var(--text-body)' }}>Highest Bid Activity</h2>
          </div>
          <Link href={`/${locale}/cars`} className="hidden text-sm font-bold sm:block" style={{ color: 'var(--copper)' }}>View All →</Link>
        </motion.div>

        <div className="overflow-hidden" ref={containerRef}>
          <motion.div
            className="flex"
            style={{ gap: GAP }}
            animate={{ x: cw > 0 ? -(offset * (cw + GAP)) : 0 }}
            transition={{ type: 'spring', stiffness: 190, damping: 36, mass: 1.1 }}
          >
            {topCars.map((car, i) => <SlideCard key={car.id} car={car} locale={locale} cw={cw} idx={i} />)}
          </motion.div>
        </div>

        {topCars.length > VISIBLE && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: maxOffset + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setOffset(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: i === offset ? 22 : 6, backgroundColor: i === offset ? 'var(--copper)' : 'rgba(75,75,75,0.16)' }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
