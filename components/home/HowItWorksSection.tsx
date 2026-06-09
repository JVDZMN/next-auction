'use client'

import { useEffect, useRef } from 'react'
import { useDict } from '@/lib/i18n/context'

export function HowItWorksSection() {
  const t = useDict().home.howItWorks
  const sectionRef = useRef<HTMLDivElement>(null)

  const steps = [
    { num: '01', title: t.step1title, body: t.step1desc, highlight: false },
    { num: '02', title: t.step2title, body: t.step2desc, highlight: true },
    { num: '03', title: t.step3title, body: t.step3desc, highlight: false },
    { num: '04', title: t.step4title, body: t.step4desc, highlight: false },
  ]

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll('.fade-in-up')
    if (!els) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="py-20 sm:py-28" style={{ backgroundColor: 'var(--card-bg)' }}>
      <div ref={sectionRef} className="mx-auto max-w-6xl px-6 sm:px-10">

        <div className="mb-14 text-center reveal">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-10" style={{ backgroundColor: 'var(--copper)' }} />
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>
              {t.label}
            </p>
            <span className="h-px w-10" style={{ backgroundColor: 'var(--copper)' }} />
          </div>
          <h2 className="text-3xl font-black sm:text-4xl" style={{ color: 'var(--text-body)', letterSpacing: '-0.01em' }}>
            {t.heading}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`reveal-scale step-card-hover delay-${i + 1} rounded-2xl p-8 flex flex-col`}
              style={step.highlight
                ? { backgroundColor: 'var(--copper)' }
                : { backgroundColor: 'var(--page-bg)', border: '1px solid var(--border)' }
              }
            >
              <span
                className="mb-4 text-5xl font-black leading-none"
                style={{ color: step.highlight ? 'rgba(255,255,255,0.35)' : 'var(--copper)' }}
              >
                {step.num}
              </span>
              <h3
                className="mb-2 text-lg font-black"
                style={{ color: step.highlight ? 'white' : 'var(--text-body)' }}
              >
                {step.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: step.highlight ? 'rgba(255,255,255,0.80)' : 'var(--text-muted)' }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
