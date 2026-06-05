'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useDict } from '@/lib/i18n/context'

interface Props { locale: string }

const FOOTER_LINK_STYLE = { color: 'rgba(255,255,255,0.50)' }
const FOOTER_LINK_HOVER  = { color: 'rgba(255,255,255,0.90)' }

export function NewsletterSection() {
  const tn = useDict().home.newsletter

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
    <section className="py-16 sm:py-20" style={{ backgroundColor: 'var(--page-bg)' }}>
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
                className="flex-1 rounded border px-4 py-3 text-base focus:outline-none"
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
  )
}

export function Footer({ locale }: Props) {
  const tf = useDict().home.footer

  return (
    <footer style={{ backgroundColor: 'var(--dark-section)' }}>
        {/* 3-column grid */}
        <div className="mx-auto max-w-7xl px-6 sm:px-10 py-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">

          {/* Col 1 — Brand */}
          <div>
            <p className="text-2xl font-black" style={{ color: 'var(--text-light)' }}>
              Next<span style={{ color: 'var(--copper)' }}>Auction</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {tf.tagline}
            </p>
          </div>

          {/* Col 2 — Navigation */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--copper)' }}>
              {tf.navTitle}
            </p>
            <ul className="flex flex-col gap-3">
              {[
                { label: tf.browse,   href: `/${locale}/cars` },
                { label: tf.dealers, href: `/${locale}/dealers` },
                { label: tf.register, href: `/${locale}/auth/signup` },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm font-medium transition-colors"
                    style={FOOTER_LINK_STYLE}
                    onMouseEnter={e => ((e.target as HTMLElement).style.color = FOOTER_LINK_HOVER.color)}
                    onMouseLeave={e => ((e.target as HTMLElement).style.color = FOOTER_LINK_STYLE.color)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Legal */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--copper)' }}>
              {tf.legalTitle}
            </p>
            <ul className="flex flex-col gap-3">
              {[
                { label: tf.terms,   href: `/${locale}/terms` },
                { label: tf.privacy, href: `/${locale}/privacy` },
                { label: tf.faq,     href: `/${locale}/faq` },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm font-medium transition-colors"
                    style={FOOTER_LINK_STYLE}
                    onMouseEnter={e => ((e.target as HTMLElement).style.color = FOOTER_LINK_HOVER.color)}
                    onMouseLeave={e => ((e.target as HTMLElement).style.color = FOOTER_LINK_STYLE.color)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mx-auto max-w-7xl px-6 sm:px-10 py-5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
            {tf.copyright}
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {tf.disclaimer}
          </p>
        </div>
      </footer>
  )
}
