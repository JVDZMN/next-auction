'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { SP } from './constants'

const PHRASES = ['Register', 'Place a Bid', 'Win Your Dream Car']

interface Props { locale: string; isSignedIn: boolean }

export function HeroSection({ locale, isSignedIn }: Props) {
  const [idx, setIdx] = useState(0)
  const done = idx === PHRASES.length - 1

  useEffect(() => {
    if (idx >= PHRASES.length - 1) return
    const t = setTimeout(() => setIdx(i => i + 1), 1500)
    return () => clearTimeout(t)
  }, [idx])

  return (
    <section className="relative flex h-screen flex-col overflow-hidden">
      <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" aria-hidden>
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0" style={{ background: `linear-gradient(145deg, ${'var(--dark-section)'} 0%, rgba(8,41,36,0.7) 55%, ${'var(--dark-section)'} 100%)`, opacity: 0.88 }} />
      <div className="absolute inset-0 bg-black/35" />

      <nav className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-12">
        <motion.div whileHover={{ scale: 1.04 }} transition={SP}>
          <Link href={`/${locale}`} className="select-none text-xl font-black text-white tracking-tight">
            Next<span style={{ color: 'var(--copper)' }}>Auction</span>
          </Link>
        </motion.div>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href={`/${locale}/cars`} className="hidden text-sm font-medium text-white/70 transition-colors hover:text-white sm:block">Browse</Link>
          <Link href={isSignedIn ? `/${locale}/dashboard` : `/${locale}/auth/signin`} className="hidden text-sm font-medium text-white/70 transition-colors hover:text-white sm:block">
            {isSignedIn ? 'Dashboard' : 'Sign In'}
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={SP}>
            <Link href={isSignedIn ? `/${locale}/cars/create` : `/${locale}/auth/signup`} className="rounded px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: 'var(--copper)' }}>
              {isSignedIn ? 'List a Car' : 'Register'}
            </Link>
          </motion.div>
        </div>
      </nav>

      <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="overflow-hidden" style={{ height: 'clamp(56px, 10vw, 100px)' }}>
          <AnimatePresence mode="wait">
            <motion.h1
              key={idx}
              initial={{ y: '110%', opacity: 0, filter: 'blur(6px)' }}
              animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: '-110%', opacity: 0, filter: 'blur(6px)' }}
              transition={{ type: 'spring', mass: 0.45, stiffness: 340, damping: 26 }}
              className="font-black leading-none text-white"
              style={{ fontSize: 'clamp(2rem, 7vw, 5.5rem)', textShadow: '0 2px 24px rgba(0,0,0,0.5)' }}
            >
              {PHRASES[idx]}
            </motion.h1>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {done && (
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, ...SP }} className="mt-5 text-base text-white/65 sm:text-lg">
              Real-time bidding · Verified sellers · Secure transactions
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {done && (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, ...SP }} className="mt-8 flex gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={SP}>
                <Link href={`/${locale}/cars`} className="rounded px-7 py-3.5 text-sm font-bold text-white" style={{ backgroundColor: 'var(--copper)' }}>
                  Browse Auctions
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} transition={SP}>
                <Link href={isSignedIn ? `/${locale}/cars/create` : `/${locale}/auth/signup`} className="rounded border px-7 py-3.5 text-sm font-bold text-white" style={{ borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  Start Selling
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="relative z-20 flex justify-center pb-7">
            <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} className="flex flex-col items-center gap-1">
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
