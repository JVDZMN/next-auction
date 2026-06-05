'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

const FAQ_ITEMS = [
  {
    q: 'Er det gratis at oprette konto?',
    a: 'Ja, oprettelse af konto er helt gratis.',
  },
  {
    q: 'Hvad sker der når jeg vinder en auktion?',
    a: 'Du kontaktes direkte af sælger for at aftale overdragelse af bilen.',
  },
  {
    q: 'Hvad er en reservepris?',
    a: 'Reserveprisen er den minimumspris sælger vil acceptere. Auktionen afsluttes kun som solgt, hvis det højeste bud når reserveprisen.',
  },
  {
    q: 'Er buddene juridisk bindende?',
    a: 'Ja, afgivne bud er bindende i henhold til dansk Købelov. Læs vores vilkår og betingelser for detaljer.',
  },
  {
    q: 'Kan jeg kontakte sælger?',
    a: 'Ja, du kan sende en direkte besked til sælger via platformen.',
  },
]

interface Props { locale: string }

export function FaqPreviewSection({ locale }: Props) {
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
    <section className="py-20 sm:py-28" style={{ backgroundColor: 'var(--page-bg)' }}>
      <div ref={sectionRef} className="mx-auto max-w-3xl px-6 sm:px-10">

        {/* Header */}
        <div className="mb-12 text-center fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-10" style={{ backgroundColor: 'var(--copper)' }} />
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>
              Ofte stillede spørgsmål
            </p>
            <span className="h-px w-10" style={{ backgroundColor: 'var(--copper)' }} />
          </div>
          <h2 className="text-3xl font-black sm:text-4xl" style={{ color: 'var(--text-body)', letterSpacing: '-0.01em' }}>
            Vi svarer på dine spørgsmål
          </h2>
        </div>

        {/* Accordion */}
        <div className="fade-in-up delay-1 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <Accordion multiple className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
            {FAQ_ITEMS.map(({ q, a }) => (
              <AccordionItem
                key={q}
                value={q}
                className="border-b-0 px-6"
                style={{ backgroundColor: 'var(--card-bg)' }}
              >
                <AccordionTrigger
                  className="py-5 text-left text-base font-semibold no-underline hover:no-underline hover:opacity-70"
                  style={{ color: 'var(--text-body)' }}
                >
                  {q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-10 text-center">
          <Link
            href={`/${locale}/faq`}
            className="text-sm font-bold hover:opacity-70 transition-opacity"
            style={{ color: 'var(--copper)' }}
          >
            Se alle spørgsmål →
          </Link>
        </div>

      </div>
    </section>
  )
}
