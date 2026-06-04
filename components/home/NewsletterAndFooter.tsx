'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useDict } from '@/lib/i18n/context'

interface Props { locale: string }

export function NewsletterAndFooter({ locale }: Props) {
  const dict = useDict().home
  const tn   = dict.newsletter
  const tf   = dict.footer

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
        <div className="mx-auto max-w-lg px-6 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>{tn.label}</p>
          <h2 className="mb-3 text-3xl font-black" style={{ color: 'var(--text-body)' }}>{tn.heading}</h2>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{tn.body}</p>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.p key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-3 font-semibold" style={{ color: 'var(--copper)' }}>
                ✓ {tn.subscribed}
              </motion.p>
            ) : (
              <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={tn.placeholder}
                  className="flex-1 rounded border px-4 py-3 text-sm focus:outline-none"
                  style={{ borderColor: 'rgba(75,75,75,0.13)', color: 'var(--text-body)', backgroundColor: 'white' }}
                />
                <button type="submit" disabled={loading} className="rounded px-6 py-3 text-sm font-bold text-white whitespace-nowrap hover:scale-105 active:scale-95 transition-transform duration-150" style={{ backgroundColor: 'var(--copper)', opacity: loading ? 0.7 : 1 }}>
                  {loading ? tn.subscribing : tn.subscribe}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--dark-section)' }}>
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:px-10 md:grid-cols-2">
          <div>
            <p className="text-2xl font-black" style={{ color: 'var(--text-light)' }}>
              Next<span style={{ color: 'var(--copper)' }}>Auction</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
              {tf.tagline}
            </p>
            <div className="mt-8 flex flex-wrap gap-6">
              {[
                { label: tf.browse,   href: `/${locale}/cars` },
                { label: tf.signIn,   href: `/${locale}/auth/signin` },
                { label: tf.register, href: `/${locale}/auth/signup` },
                { label: tf.listCar,  href: `/${locale}/cars/create` },
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
              <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--copper)' }}>{tf.certified}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row sm:px-10" style={{ borderTop: '1px solid rgba(255,255,255,0.09)' }}>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>{tf.copyright}</p>
          <div className="flex gap-6">
            {[
              { label: tf.privacy, href: `/${locale}/privacy` },
              { label: tf.terms,   href: `/${locale}/terms` },
              { label: tf.faq,     href: `/${locale}/faq` },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className="text-xs transition-colors"
                style={{ color: 'rgba(255,255,255,0.32)' }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.80)')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.32)')}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
