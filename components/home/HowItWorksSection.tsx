'use client'

import { useEffect, useRef } from 'react'

const STEPS = [
  {
    num: '01',
    title: 'Opret konto',
    body: 'Gratis registrering på 2 minutter',
    highlight: false,
  },
  {
    num: '02',
    title: 'Find din bil',
    body: 'Søg og filtrer blandt alle auktioner',
    highlight: true,
  },
  {
    num: '03',
    title: 'Afgiv bud',
    body: 'Byd i realtid — højeste bud vinder',
    highlight: false,
  },
  {
    num: '04',
    title: 'Kontakt sælger',
    body: 'Vinder kontakter sælger direkte',
    highlight: false,
  },
]

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

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

        {/* Header */}
        <div className="mb-14 text-center fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-10" style={{ backgroundColor: 'var(--copper)' }} />
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>
              Sådan fungerer det
            </p>
            <span className="h-px w-10" style={{ backgroundColor: 'var(--copper)' }} />
          </div>
          <h2 className="text-3xl font-black sm:text-4xl" style={{ color: 'var(--text-body)', letterSpacing: '-0.01em' }}>
            Kom i gang på 4 trin
          </h2>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`fade-in-up delay-${i} rounded-2xl p-8 flex flex-col`}
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
