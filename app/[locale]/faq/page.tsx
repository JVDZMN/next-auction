import Link from 'next/link'
import { toLocale } from '@/lib/i18n'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

export const metadata = {
  title: 'FAQ – Next Auction',
  description: 'Svar på de mest stillede spørgsmål om Next Auction.',
}

const CATEGORIES = [
  {
    label: 'Generelt',
    items: [
      {
        q: 'Hvad er Next Auction?',
        a: 'En digital platform der forbinder bilkøbere og sælgere gennem realtidsauktioner.',
      },
      {
        q: 'Er det gratis?',
        a: 'Ja, det er gratis at oprette konto og afgive bud.',
      },
      {
        q: 'Er Next Auction ansvarlig for handlen?',
        a: 'Nej. Next Auction er en formidlingsplatform. Handlen indgås direkte mellem køber og sælger. Vi er ikke part i handlen.',
      },
    ],
  },
  {
    label: 'For Købere',
    items: [
      {
        q: 'Er buddene bindende?',
        a: 'Ja, afgivne bud er juridisk bindende i henhold til dansk Købelov.',
      },
      {
        q: 'Hvad sker der når jeg vinder?',
        a: 'Sælger kontakter dig direkte for at aftale overdragelse af køretøjet.',
      },
      {
        q: 'Kan jeg fortryde mit bud?',
        a: 'Nej. Et bud kan ikke tilbagekaldes.',
      },
      {
        q: 'Bør jeg se bilen inden jeg byder?',
        a: 'Ja, vi anbefaler altid fysisk besigtigelse inden budafgivelse. Køb sker på eget ansvar.',
      },
    ],
  },
  {
    label: 'For Sælgere',
    items: [
      {
        q: 'Hvor mange biler kan jeg sælge?',
        a: 'Private: max 2 biler om året (SKAT-regel). Erhverv: ubegrænset med gyldigt CVR-nummer.',
      },
      {
        q: 'Er jeg ansvarlig for annoncens indhold?',
        a: 'Ja, sælger er fuldt ansvarlig for alle oplysninger i annoncen.',
      },
      {
        q: 'Hvad hvis ingen byder?',
        a: 'Auktionen afsluttes uden salg. Du kan oprette en ny auktion.',
      },
    ],
  },
  {
    label: 'Regler',
    items: [
      {
        q: 'Hvad må jeg ikke gøre?',
        a: 'Falske oplysninger, manipulation af bud og salg af stjålne biler er strengt forbudt og vil medføre permanent udelukkelse.',
      },
    ],
  },
]

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = toLocale(rawLocale)

  return (
    <main style={{ backgroundColor: 'var(--page-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--dark-section)' }} className="relative overflow-hidden py-20 sm:py-28">
        {/* Diagonal accent */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: 0, top: 0, bottom: 0,
            width: '40%',
            background: 'var(--copper)',
            clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)',
            opacity: 0.1,
            pointerEvents: 'none',
          }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-6 sm:px-10">
          <Link href={`/${locale}`} className="mb-6 inline-block text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'rgba(255,255,255,0.6)' }}>
            ← Tilbage til forsiden
          </Link>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>
            Hjælp og support
          </p>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Ofte stillede spørgsmål
          </h1>
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="mx-auto max-w-3xl px-6 sm:px-10 py-16 sm:py-20">
        <div className="flex flex-col gap-14">
          {CATEGORIES.map(cat => (
            <section key={cat.label}>
              <h2 className="mb-6 text-xl font-black" style={{ color: 'var(--text-body)' }}>
                <span
                  className="mr-2 inline-block h-1 w-8 align-middle rounded-full"
                  style={{ backgroundColor: 'var(--copper)' }}
                />
                {cat.label}
              </h2>

              <Accordion multiple className="flex flex-col divide-y rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                {cat.items.map(({ q, a }) => (
                  <AccordionItem key={q} value={q} className="border-b-0 bg-white px-5">
                    <AccordionTrigger
                      className="py-4 text-left text-sm font-semibold no-underline hover:no-underline hover:opacity-80"
                      style={{ color: 'var(--text-body)' }}
                    >
                      {q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-xl p-8 text-center" style={{ backgroundColor: 'var(--dark-section)' }}>
          <p className="mb-2 text-base font-black text-white">Fandt du ikke svar på dit spørgsmål?</p>
          <p className="mb-5 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Kontakt os direkte — vi svarer inden for 24 timer.
          </p>
          <a
            href="mailto:support@next-auction.dk"
            className="inline-block rounded px-6 py-3 text-sm font-bold text-white hover:scale-105 transition-transform duration-150"
            style={{ backgroundColor: 'var(--copper)' }}
          >
            Skriv til os
          </a>
        </div>
      </div>
    </main>
  )
}
