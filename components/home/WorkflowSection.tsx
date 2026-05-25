'use client'

import { Fragment, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { SP, SPX } from './constants'
import { useDict } from '@/lib/i18n/context'

type IconFC = (p: { className?: string }) => React.ReactNode

const STEP_ICONS: IconFC[] = [
  ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
]

interface Props { locale: string }

export function WorkflowSection({ locale }: Props) {
  const t      = useDict().home.workflow
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const steps = [
    { id: 1, label: t.step1label, desc: t.step1desc, Icon: STEP_ICONS[0] },
    { id: 2, label: t.step2label, desc: t.step2desc, Icon: STEP_ICONS[1] },
    { id: 3, label: t.step3label, desc: t.step3desc, Icon: STEP_ICONS[2] },
    { id: 4, label: t.step4label, desc: t.step4desc, Icon: STEP_ICONS[3] },
  ]

  return (
    <section className="min-h-screen flex flex-col justify-center py-16 sm:py-20" style={{ backgroundColor: 'var(--dark-section)' }}>
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={SPX} className="mb-16 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>{t.label}</p>
          <h2 className="text-3xl font-black sm:text-4xl" style={{ color: 'var(--text-light)' }}>{t.heading}</h2>
        </motion.div>

        <div ref={ref} className="relative flex flex-col items-center gap-10 sm:flex-row sm:items-start sm:justify-between sm:gap-0">
          {steps.map((step, i) => (
            <Fragment key={step.id}>
              <motion.div
                custom={i}
                initial="hidden"
                animate={inView ? 'show' : 'hidden'}
                variants={{
                  hidden: { scale: 0.55, opacity: 0 },
                  show: (n: number) => ({ scale: 1, opacity: 1, transition: { delay: n * 0.17, ...SP } }),
                }}
                className="z-10 flex flex-col items-center text-center"
                style={{ width: 'clamp(100px, 22%, 150px)' }}
              >
                <motion.div
                  className="mb-4 flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'var(--dark-section)', border: `2px solid ${'var(--copper)'}`, boxShadow: `0 0 0 0px ${'var(--dark-section)'}` }}
                  whileHover={{ scale: 1.1, boxShadow: 'rgba(18,37,53,0.25) 0 0 0 10px' }}
                  transition={SP}
                >
                  <step.Icon className="h-9 w-9 text-white" />
                </motion.div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--copper)' }}>0{step.id}</p>
                <p className="mb-1.5 text-lg font-black" style={{ color: 'var(--text-light)' }}>{step.label}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)', maxWidth: 110 }}>{step.desc}</p>
              </motion.div>

              {i < steps.length - 1 && (
                <div className="hidden sm:flex flex-1 items-center justify-center mt-9">
                  <svg width="80" height="20" viewBox="0 0 80 20" fill="none" overflow="visible">
                    <motion.line x1={0} y1={10} x2={72} y2={10} stroke={'var(--copper)'} strokeWidth={1.5} strokeDasharray="5 4" strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                      transition={{ delay: i * 0.17 + 0.32, duration: 0.45, ease: 'easeOut' }}
                    />
                    <motion.polyline points="66,4 78,10 66,16" fill="none" stroke={'var(--copper)'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
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

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...SPX, delay: 0.35 }} className="mt-16 text-center">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={SP} className="inline-block">
            <Link href={`/${locale}/auth/signup`} className="inline-flex items-center gap-2 rounded px-8 py-4 text-sm font-bold text-white" style={{ backgroundColor: 'var(--copper)' }}>
              {t.cta}
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
