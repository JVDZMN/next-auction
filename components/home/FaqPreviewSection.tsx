'use client'

import Link from 'next/link'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { useInView } from '@/lib/use-in-view'

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
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: '-60px' })

  return (
    <section className="py-20 sm:py-28" style={{ backgroundColor: 'var(--dark-section)' }}>
      <div className="mx-auto max-w-3xl px-6 sm:px-10">

        <div
          className="mb-12 text-center"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.55s ease, transform 0.55s ease',
          }}
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>
            Spørgsmål og svar
          </p>
          <h2 className="text-3xl font-black sm:text-4xl" style={{ color: 'var(--text-light)' }}>
            Ofte stillede spørgsmål
          </h2>
        </div>

        <div
          ref={ref}
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.55s ease 0.1s, transform 0.55s ease 0.1s',
          }}
        >
          <Accordion multiple className="flex flex-col divide-y" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            {FAQ_ITEMS.map(({ q, a }) => (
              <AccordionItem key={q} value={q} className="border-b-0 py-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <AccordionTrigger
                  className="py-4 text-left text-base font-semibold no-underline hover:no-underline hover:opacity-80"
                  style={{ color: 'var(--text-light)' }}
                >
                  {q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
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
