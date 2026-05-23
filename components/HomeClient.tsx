'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion, useInView } from 'framer-motion'

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  green:    '#1B4D3E',
  greenDk:  '#163D31',
  bronze:   '#A07040',
  offwhite: '#F5F3EF',
  gray:     '#4B5563',
  ink:      '#0D1117',
} as const

// ── Spring presets ────────────────────────────────────────────────────────────
const SP  = { type: 'spring', stiffness: 260, damping: 28 } as const
const SPX = { type: 'spring', stiffness: 200, damping: 30 } as const

// ── Types ─────────────────────────────────────────────────────────────────────
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
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeLeft(iso: string): { label: string; urgent: boolean } {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return { label: 'Ended', urgent: false }
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (d > 0) return { label: `${d}d ${h}h`,  urgent: false }
  if (h > 0) return { label: `${h}h ${m}m`,  urgent: true  }
  return       { label: `${m}m`,             urgent: true  }
}

// ── Brand data ────────────────────────────────────────────────────────────────
const BRANDS = [
  'Volkswagen', 'BMW', 'Audi', 'Tesla', 'Volvo',
  'Toyota', 'Mercedes-Benz', 'Porsche', 'Hyundai', 'Skoda',
]

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 1 — Cinematic Hero
// ════════════════════════════════════════════════════════════════════════════════
const PHRASES = ['Register', 'Place a Bid', 'Win Your Dream Car']

function HeroSection({ locale, isSignedIn }: { locale: string; isSignedIn: boolean }) {
  const [idx, setIdx] = useState(0)
  const done = idx === PHRASES.length - 1

  useEffect(() => {
    if (idx >= PHRASES.length - 1) return
    const t = setTimeout(() => setIdx(i => i + 1), 1500)
    return () => clearTimeout(t)
  }, [idx])

  return (
    <section className="relative flex h-screen flex-col overflow-hidden">
      {/* ── Video + overlay ── */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>
      {/* Gradient fallback shown when no video loads */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(145deg, ${C.ink} 0%, ${C.green} 55%, ${C.ink} 100%)`,
          opacity: 0.88,
        }}
      />
      <div className="absolute inset-0 bg-black/35" />

      {/* ── Nav ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-12">
        <motion.div whileHover={{ scale: 1.04 }} transition={SP}>
          <Link href={`/${locale}`} className="select-none text-xl font-black text-white tracking-tight">
            Next<span style={{ color: C.bronze }}>Auction</span>
          </Link>
        </motion.div>

        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href={`/${locale}/cars`}
            className="hidden text-sm font-medium text-white/70 transition-colors hover:text-white sm:block"
          >
            Browse
          </Link>
          <Link
            href={isSignedIn ? `/${locale}/dashboard` : `/${locale}/auth/signin`}
            className="hidden text-sm font-medium text-white/70 transition-colors hover:text-white sm:block"
          >
            {isSignedIn ? 'Dashboard' : 'Sign In'}
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={SP}>
            <Link
              href={isSignedIn ? `/${locale}/cars/create` : `/${locale}/auth/signup`}
              className="rounded px-4 py-2 text-sm font-bold text-white"
              style={{ backgroundColor: C.green }}
            >
              {isSignedIn ? 'List a Car' : 'Register'}
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* ── Kinetic centre ── */}
      <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-4 text-center">
        {/* Phrase masking container */}
        <div className="overflow-hidden" style={{ height: 'clamp(56px, 10vw, 100px)' }}>
          <AnimatePresence mode="wait">
            <motion.h1
              key={idx}
              initial={{ y: '110%', opacity: 0, filter: 'blur(6px)' }}
              animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: '-110%', opacity: 0, filter: 'blur(6px)' }}
              transition={{ type: 'spring', mass: 0.45, stiffness: 340, damping: 26 }}
              className="font-black leading-none text-white"
              style={{
                fontSize: 'clamp(2rem, 7vw, 5.5rem)',
                textShadow: '0 2px 24px rgba(0,0,0,0.5)',
              }}
            >
              {PHRASES[idx]}
            </motion.h1>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {done && (
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, ...SP }}
              className="mt-5 text-base text-white/65 sm:text-lg"
            >
              Real-time bidding · Verified sellers · Secure transactions
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, ...SP }}
              className="mt-8 flex gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={SP}>
                <Link
                  href={`/${locale}/cars`}
                  className="rounded px-7 py-3.5 text-sm font-bold text-white"
                  style={{ backgroundColor: C.bronze }}
                >
                  Browse Auctions
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={SP}>
                <Link
                  href={isSignedIn ? `/${locale}/cars/create` : `/${locale}/auth/signup`}
                  className="rounded border px-7 py-3.5 text-sm font-bold text-white"
                  style={{
                    borderColor: 'rgba(255,255,255,0.28)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  Start Selling
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Scroll hint ── */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="relative z-20 flex justify-center pb-7"
          >
            <motion.div
              animate={{ y: [0, 7, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Scroll</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white/35">
                <path d="M7 2v10M2 8l5 5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 2 — Welcome & Nordic Green Showcase
// ════════════════════════════════════════════════════════════════════════════════
function WelcomeSection({ locale, showcaseImage }: { locale: string; showcaseImage: string | null }) {
  return (
    <section className="py-24 sm:py-32" style={{ backgroundColor: C.offwhite }}>
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 sm:px-10 md:grid-cols-2 lg:gap-24">

        {/* Left — text */}
        <motion.div
          initial={{ x: -48, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={SPX}
        >
          <p
            className="mb-4 text-xs font-bold uppercase tracking-[0.25em]"
            style={{ color: C.bronze }}
          >
            Exclusive Auctions
          </p>
          <h2
            className="mb-5 text-4xl font-black leading-tight sm:text-5xl"
            style={{ color: C.ink }}
          >
            The Premier Marketplace for Exceptional Automobiles
          </h2>
          <p className="mb-8 text-base leading-relaxed" style={{ color: C.gray }}>
            Discover a curated selection of luxury, classic, and high-performance vehicles.
            Our platform connects discerning buyers with verified sellers across Scandinavia —
            with live bidding, transparent pricing, and complete buyer protection.
          </p>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={SP} className="inline-block">
            <Link
              href={`/${locale}/cars`}
              className="inline-flex items-center gap-2 rounded px-7 py-3.5 text-sm font-bold text-white"
              style={{ backgroundColor: C.green }}
            >
              Explore Auctions
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M3 7.5h9M8 3l4.5 4.5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>

        {/* Right — bounded frame */}
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ ...SPX, delay: 0.1 }}
          className="relative"
        >
          {/* Offset green border */}
          <div
            className="absolute inset-0 z-0"
            style={{ border: `5px solid ${C.green}`, transform: 'translate(14px, 14px)' }}
          />
          {/* Image block */}
          <div
            className="relative z-10 overflow-hidden"
            style={{ aspectRatio: '4/3', backgroundColor: C.green }}
          >
            {showcaseImage ? (
              <Image
                src={showcaseImage}
                alt="Featured vehicle"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 45vw"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <CarSilhouetteSVG className="h-24 w-36 text-white/25" />
              </div>
            )}
            {/* Bronze accent corner tab */}
            <div className="absolute left-0 top-0 h-10 w-10" style={{ backgroundColor: C.bronze }} />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Interactive Brand Carousel
// ════════════════════════════════════════════════════════════════════════════════
function BrandCarousel() {
  const outerRef = useRef<HTMLDivElement>(null)
  const [dragMax, setDragMax] = useState(0)

  useEffect(() => {
    const update = () => {
      if (outerRef.current) {
        const track = outerRef.current.firstElementChild as HTMLElement | null
        if (track) setDragMax(Math.max(0, track.scrollWidth - outerRef.current.offsetWidth))
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <section className="py-20 sm:py-28" style={{ backgroundColor: C.ink }}>
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={SPX}
          className="mb-12 text-center"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: C.bronze }}>
            Leading Marques
          </p>
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            The Finest Brands on the Market
          </h2>
          <p className="mt-3 text-sm text-white/45">Drag to explore ·  hover to interact</p>
        </motion.div>
      </div>

      <div
        ref={outerRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
      >
        <motion.div
          drag="x"
          dragConstraints={{ right: 0, left: -dragMax }}
          dragTransition={{ bounceDamping: 32, bounceStiffness: 360 }}
          className="flex gap-4 px-6 sm:px-10"
          style={{ width: 'max-content' }}
        >
          {BRANDS.map(brand => (
            <motion.div
              key={brand}
              whileHover={{ scale: 1.1, y: -5 }}
              transition={SP}
              className="flex-shrink-0 flex flex-col items-center justify-center w-36 h-24 rounded-xl"
              style={{
                backgroundColor: 'rgba(255,255,255,0.055)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              <BrandMark name={brand} />
              <span className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-white/45">
                {brand}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function BrandMark({ name }: { name: string }) {
  const abbr = name === 'Mercedes-Benz' ? 'MB' : name.slice(0, name.includes('-') ? 2 : 3).toUpperCase()
  const marks: Record<string, React.ReactNode> = {
    Audi: (
      <svg viewBox="0 0 48 16" width="44" height="14" aria-label="Audi">
        {[0, 11, 22, 33].map(x => (
          <circle key={x} cx={x + 7} cy={8} r={6.5} fill="none" stroke="white" strokeWidth={1.5} />
        ))}
      </svg>
    ),
    BMW: (
      <svg viewBox="0 0 32 32" width="30" height="30" aria-label="BMW">
        <circle cx={16} cy={16} r={14} fill="none" stroke="white" strokeWidth={1.5} />
        <line x1={16} y1={2} x2={16} y2={30} stroke="white" strokeWidth={1.2} />
        <line x1={2} y1={16} x2={30} y2={16} stroke="white" strokeWidth={1.2} />
        <path d="M16 2 A14 14 0 0 1 30 16 L16 16 Z" fill="white" opacity={0.55} />
        <path d="M16 16 A14 14 0 0 1 2 30 L16 30 Z" fill="white" opacity={0.55} />
      </svg>
    ),
    Tesla: (
      <svg viewBox="0 0 28 32" width="22" height="26" aria-label="Tesla">
        <path d="M14 4 L28 4 Q26 8 14 8 Q2 8 0 4 L14 4 Z" fill="white" />
        <line x1={14} y1={4} x2={14} y2={30} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
      </svg>
    ),
    Volvo: (
      <svg viewBox="0 0 32 32" width="28" height="28" aria-label="Volvo">
        <circle cx={14} cy={16} r={11} fill="none" stroke="white" strokeWidth={1.5} />
        <line x1={23} y1={9} x2={31} y2={1} stroke="white" strokeWidth={1.5} strokeLinecap="round" />
        <polyline points="25,1 31,1 31,7" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  }
  return (
    marks[name] ?? (
      <span className="font-black text-white" style={{ fontSize: abbr.length > 2 ? 13 : 16, letterSpacing: '0.04em' }}>
        {abbr}
      </span>
    )
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 4 — Top-Bid Live Slideshow
// ════════════════════════════════════════════════════════════════════════════════
const VISIBLE = 3
const GAP     = 20
const TICK    = 10_000

function SlideshowSection({ topCars, locale }: { topCars: TopCar[]; locale: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cw, setCw]       = useState(0) // card pixel width
  const [offset, setOffset] = useState(0)

  const maxOffset = Math.max(0, topCars.length - VISIBLE)

  const recalc = useCallback(() => {
    if (containerRef.current) {
      setCw((containerRef.current.offsetWidth - GAP * (VISIBLE - 1)) / VISIBLE)
    }
  }, [])

  useEffect(() => {
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [recalc])

  useEffect(() => {
    if (topCars.length <= VISIBLE) return
    const id = setInterval(() => setOffset(p => (p >= maxOffset ? 0 : p + 1)), TICK)
    return () => clearInterval(id)
  }, [topCars.length, maxOffset])

  if (topCars.length === 0) return null

  return (
    <section className="py-20 sm:py-28" style={{ backgroundColor: C.offwhite }}>
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={SPX}
          className="mb-10 flex items-end justify-between"
        >
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: C.bronze }}>
              Most Active
            </p>
            <h2 className="text-3xl font-black sm:text-4xl" style={{ color: C.ink }}>
              Highest Bid Activity
            </h2>
          </div>
          <Link href={`/${locale}/cars`} className="hidden text-sm font-bold sm:block" style={{ color: C.green }}>
            View All →
          </Link>
        </motion.div>

        {/* Track */}
        <div className="overflow-hidden" ref={containerRef}>
          <motion.div
            className="flex"
            style={{ gap: GAP }}
            animate={{ x: cw > 0 ? -(offset * (cw + GAP)) : 0 }}
            transition={{ type: 'spring', stiffness: 190, damping: 36, mass: 1.1 }}
          >
            {topCars.map((car, i) => (
              <SlideCard key={car.id} car={car} locale={locale} cw={cw} idx={i} />
            ))}
          </motion.div>
        </div>

        {/* Dot nav */}
        {topCars.length > VISIBLE && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: maxOffset + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setOffset(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === offset ? 22 : 6,
                  backgroundColor: i === offset ? C.green : `${C.ink}28`,
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function SlideCard({ car, locale, cw, idx }: { car: TopCar; locale: string; cw: number; idx: number }) {
  const tl = timeLeft(car.auctionEndDate)
  return (
    <motion.div
      className="flex-shrink-0 overflow-hidden rounded-2xl bg-white"
      style={{
        width: cw > 0 ? cw : '33%',
        boxShadow: '0 2px 14px rgba(0,0,0,0.07)',
      }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SP, delay: idx * 0.04 }}
      whileHover={{ y: -5, boxShadow: '0 10px 32px rgba(0,0,0,0.13)' }}
    >
      <Link href={`/${locale}/cars/${car.id}`} className="block">
        {/* Image */}
        <div
          className="relative overflow-hidden"
          style={{ aspectRatio: '16/10', backgroundColor: `${C.green}22` }}
        >
          {car.images[0] ? (
            <Image
              src={car.images[0]}
              alt={`${car.year} ${car.brand} ${car.model}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <CarSilhouetteSVG className="h-14 w-20 text-white/30" />
            </div>
          )}
          {/* Bid count pill */}
          <div
            className="absolute right-3 top-3 rounded px-2 py-0.5 text-xs font-bold text-white"
            style={{ backgroundColor: C.bronze }}
          >
            {car.bidCount} bids
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="truncate text-sm font-black" style={{ color: C.ink }}>
            {car.year} {car.brand} {car.model}
          </p>
          {car.subModel && (
            <p className="mt-0.5 truncate text-xs" style={{ color: C.gray }}>{car.subModel}</p>
          )}
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-xs" style={{ color: C.gray }}>Current Bid</p>
              <p className="text-base font-bold" style={{ color: C.green }}>
                {car.currentPrice.toLocaleString('da-DK')} kr
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: C.gray }}>Ends in</p>
              <p
                className="text-sm font-semibold"
                style={{ color: tl.urgent ? '#DC2626' : C.gray }}
              >
                {tl.label}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 5 — Bidding Workflow
// ════════════════════════════════════════════════════════════════════════════════
type IconFC = (p: { className?: string }) => React.ReactNode

const STEPS: { id: number; label: string; desc: string; Icon: IconFC }[] = [
  {
    id: 1, label: 'Register',
    desc: 'Create your free account in minutes',
    Icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    id: 2, label: 'Select',
    desc: 'Browse and find your dream vehicle',
    Icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 3, label: 'Bid',
    desc: 'Place real-time competitive bids',
    Icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 4, label: 'Win',
    desc: 'Secure your winning vehicle',
    Icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
]

function WorkflowSection({ locale }: { locale: string }) {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 sm:py-32" style={{ backgroundColor: C.ink }}>
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={SPX}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: C.bronze }}>
            How It Works
          </p>
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            Four Steps to Your Next Car
          </h2>
        </motion.div>

        {/* Steps row */}
        <div
          ref={ref}
          className="relative flex flex-col items-center gap-10 sm:flex-row sm:items-start sm:justify-between sm:gap-0"
        >
          {STEPS.map((step, i) => (
            <Fragment key={step.id}>
              {/* ── Circle node ── */}
              <motion.div
                custom={i}
                initial="hidden"
                animate={inView ? 'show' : 'hidden'}
                variants={{
                  hidden: { scale: 0.55, opacity: 0 },
                  show: (n: number) => ({
                    scale: 1,
                    opacity: 1,
                    transition: { delay: n * 0.17, ...SP },
                  }),
                }}
                className="z-10 flex flex-col items-center text-center"
                style={{ width: 'clamp(100px, 22%, 150px)' }}
              >
                <motion.div
                  className="mb-4 flex h-20 w-20 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: C.green,
                    border: `2px solid ${C.bronze}`,
                    boxShadow: `0 0 0 0px ${C.green}`,
                  }}
                  whileHover={{
                    scale: 1.1,
                    boxShadow: `0 0 0 10px ${C.green}40`,
                  }}
                  transition={SP}
                >
                  <step.Icon className="h-9 w-9 text-white" />
                </motion.div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: C.bronze }}>
                  0{step.id}
                </p>
                <p className="mb-1.5 text-lg font-black text-white">{step.label}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)', maxWidth: 110 }}>
                  {step.desc}
                </p>
              </motion.div>

              {/* ── Animated arrow ── */}
              {i < STEPS.length - 1 && (
                <div className="hidden sm:flex flex-1 items-center justify-center mt-9">
                  <svg width="80" height="20" viewBox="0 0 80 20" fill="none" overflow="visible">
                    <motion.line
                      x1={0} y1={10} x2={72} y2={10}
                      stroke={C.bronze}
                      strokeWidth={1.5}
                      strokeDasharray="5 4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={inView
                        ? { pathLength: 1, opacity: 1 }
                        : { pathLength: 0, opacity: 0 }}
                      transition={{ delay: i * 0.17 + 0.32, duration: 0.45, ease: 'easeOut' }}
                    />
                    <motion.polyline
                      points="66,4 78,10 66,16"
                      fill="none"
                      stroke={C.bronze}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ delay: i * 0.17 + 0.72, duration: 0.25 }}
                    />
                  </svg>
                </div>
              )}
            </Fragment>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...SPX, delay: 0.35 }}
          className="mt-16 text-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={SP} className="inline-block">
            <Link
              href={`/${locale}/auth/signup`}
              className="inline-flex items-center gap-2 rounded px-8 py-4 text-sm font-bold text-white"
              style={{ backgroundColor: C.bronze }}
            >
              Start Bidding Today
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 6 — Newsletter + Footer
// ════════════════════════════════════════════════════════════════════════════════
function NewsletterAndFooter({ locale }: { locale: string }) {
  const [email, setEmail]   = useState('')
  const [done, setDone]     = useState(false)
  const [loading, setLoad]  = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoad(true)
    setTimeout(() => { setDone(true); setEmail(''); setLoad(false) }, 900)
  }

  return (
    <>
      {/* ── Newsletter ── */}
      <section className="py-20 sm:py-28" style={{ backgroundColor: C.offwhite }}>
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={SPX}
          className="mx-auto max-w-lg px-6 text-center"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: C.bronze }}>
            Stay Informed
          </p>
          <h2 className="mb-3 text-3xl font-black" style={{ color: C.ink }}>Exclusive Updates, First</h2>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: C.gray }}>
            Receive early access to premium listings, auction alerts, and Nordic automotive news.
          </p>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.p
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-3 font-semibold"
                style={{ color: C.green }}
              >
                ✓ Subscribed — we'll be in touch.
              </motion.p>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={submit}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="flex-1 rounded border px-4 py-3 text-sm focus:outline-none"
                  style={{
                    borderColor: `${C.ink}22`,
                    color: C.ink,
                    backgroundColor: 'white',
                  }}
                />
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={SP}
                  className="rounded px-6 py-3 text-sm font-bold text-white whitespace-nowrap"
                  style={{ backgroundColor: C.bronze, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Subscribing…' : 'Subscribe'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: C.green }}>
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:px-10 md:grid-cols-2">
          {/* Left */}
          <div>
            <p className="text-2xl font-black text-white">
              Next<span style={{ color: C.bronze }}>Auction</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Specialized in the sale of exclusive vehicles at home and abroad.
              Connecting passionate buyers with exceptional automobiles since 2024.
            </p>
            <div className="mt-8 flex flex-wrap gap-6">
              {[
                { label: 'Browse Cars',   href: `/${locale}/cars` },
                { label: 'Sign In',       href: `/${locale}/auth/signin` },
                { label: 'Register',      href: `/${locale}/auth/signup` },
                { label: 'List a Car',    href: `/${locale}/cars/create` },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-sm font-medium transition-colors"
                  style={{ color: 'rgba(255,255,255,0.50)' }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = 'white')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.50)')}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right — Shield */}
          <div className="flex items-start justify-start md:justify-end">
            <div className="flex flex-col items-center gap-3">
              <svg width="68" height="80" viewBox="0 0 68 80" fill="none">
                <path
                  d="M34 4 L64 16 L64 44 Q64 66 34 76 Q4 66 4 44 L4 16 Z"
                  fill="rgba(255,255,255,0.07)"
                  stroke={C.bronze}
                  strokeWidth="1.5"
                />
                <path
                  d="M22 40 l9 9 L46 34"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: C.bronze }}>
                Certified Platform
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row sm:px-10"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>
            © 2026 Automotive Auctions. All rights reserved.
          </p>
          <div className="flex gap-6">
            {['Privacy Statement', 'Terms and Conditions', 'FAQ'].map(label => (
              <a
                key={label}
                href="#"
                className="text-xs transition-colors"
                style={{ color: 'rgba(255,255,255,0.32)' }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.32)')}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </>
  )
}

// ── Misc SVGs ─────────────────────────────────────────────────────────────────
function CarSilhouetteSVG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 34 L20 24 L38 18 L60 16 L82 18 L98 24 L104 30 L108 34 L100 34 Q97 26 88 26 Q79 26 76 34 L44 34 Q41 26 32 26 Q23 26 20 34 Z" />
      <circle cx="30" cy="34" r="8" />
      <circle cx="90" cy="34" r="8" />
    </svg>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// ROOT EXPORT
// ════════════════════════════════════════════════════════════════════════════════
export function HomeClient({ locale, isSignedIn, topCars, showcaseImage }: HomeClientProps) {
  return (
    <main>
      <HeroSection     locale={locale} isSignedIn={isSignedIn} />
      <WelcomeSection  locale={locale} showcaseImage={showcaseImage} />
      <BrandCarousel />
      <SlideshowSection topCars={topCars} locale={locale} />
      <WorkflowSection locale={locale} />
      <NewsletterAndFooter locale={locale} />
    </main>
  )
}
