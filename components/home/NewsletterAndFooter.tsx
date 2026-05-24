'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { SP, SPX } from './constants'

interface Props { locale: string }

export function NewsletterAndFooter({ locale }: Props) {
  const [email,   setEmail] = useState('')
  const [done,    setDone]  = useState(false)
  const [loading, setLoad]  = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoad(true)
    setTimeout(() => { setDone(true); setEmail(''); setLoad(false) }, 900)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Newsletter */}
      <section className="flex-1 flex flex-col justify-center py-16 sm:py-20" style={{ backgroundColor: 'var(--page-bg)' }}>
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={SPX} className="mx-auto max-w-lg px-6 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>Stay Informed</p>
          <h2 className="mb-3 text-3xl font-black" style={{ color: 'var(--text-body)' }}>Exclusive Updates, First</h2>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Receive early access to premium listings, auction alerts, and Nordic automotive news.
          </p>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.p key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-3 font-semibold" style={{ color: 'var(--copper)' }}>
                ✓ Subscribed — we&apos;ll be in touch.
              </motion.p>
            ) : (
              <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
                  className="flex-1 rounded border px-4 py-3 text-sm focus:outline-none"
                  style={{ borderColor: 'rgba(75,75,75,0.13)', color: 'var(--text-body)', backgroundColor: 'white' }}
                />
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={SP} className="rounded px-6 py-3 text-sm font-bold text-white whitespace-nowrap" style={{ backgroundColor: 'var(--copper)', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Subscribing…' : 'Subscribe'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--dark-section)' }}>
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:px-10 md:grid-cols-2">
          <div>
            <p className="text-2xl font-black" style={{ color: 'var(--text-light)' }}>
              Next<span style={{ color: 'var(--copper)' }}>Auction</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Specialized in the sale of exclusive vehicles at home and abroad.
              Connecting passionate buyers with exceptional automobiles since 2024.
            </p>
            <div className="mt-8 flex flex-wrap gap-6">
              {[
                { label: 'Browse Cars', href: `/${locale}/cars` },
                { label: 'Sign In',     href: `/${locale}/auth/signin` },
                { label: 'Register',    href: `/${locale}/auth/signup` },
                { label: 'List a Car',  href: `/${locale}/cars/create` },
              ].map(({ label, href }) => (
                <Link key={label} href={href} className="text-sm font-medium transition-colors"
                  style={{ color: 'rgba(255,255,255,0.50)' }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.90)')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.50)')}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-start justify-start md:justify-end">
            <div className="flex flex-col items-center gap-3">
              <svg width="68" height="80" viewBox="0 0 68 80" fill="none">
                <path d="M34 4 L64 16 L64 44 Q64 66 34 76 Q4 66 4 44 L4 16 Z" fill="rgba(255,255,255,0.06)" stroke={'var(--copper)'} strokeWidth="1.5" />
                <path d="M22 40 l9 9 L46 34" stroke={'var(--text-light)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--copper)' }}>Certified Platform</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row sm:px-10" style={{ borderTop: '1px solid rgba(255,255,255,0.09)' }}>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>© 2026 Automotive Auctions. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy Statement', 'Terms and Conditions', 'FAQ'].map(label => (
              <a key={label} href="#" className="text-xs transition-colors"
                style={{ color: 'rgba(255,255,255,0.32)' }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.80)')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.32)')}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
