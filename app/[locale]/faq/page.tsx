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
        a: 'Next Auction er en dansk online auktionsplatform til køb og salg af biler. Private og erhvervssælgere kan oprette auktioner, og registrerede brugere kan afgive bud i realtid.',
      },
      {
        q: 'Er det gratis at oprette konto?',
        a: 'Ja, oprettelse af konto er helt gratis. Der er ingen skjulte gebyrer for private brugere.',
      },
      {
        q: 'Hvilke betalingsmetoder accepteres?',
        a: 'Betaling aftales direkte mellem køber og sælger efter auktionens afslutning. Next Auction formidler kun kontakten.',
      },
      {
        q: 'Er platformen tilgængelig på mobil?',
        a: 'Ja, Next Auction er fuldt responsivt og fungerer på alle enheder — desktop, tablet og mobil.',
      },
    ],
  },
  {
    label: 'For Købere',
    items: [
      {
        q: 'Hvordan afgiver jeg et bud?',
        a: 'Opret en konto, find den bil du er interesseret i, og klik på "Afgiv bud". Angiv dit budbeløb og bekræft. Husk: bud er juridisk bindende.',
      },
      {
        q: 'Hvad sker der når jeg vinder en auktion?',
        a: 'Du modtager en e-mail med kontaktoplysninger på sælger. Herefter aftales overdragelse og betaling direkte med sælger.',
      },
      {
        q: 'Kan jeg trække et bud tilbage?',
        a: 'Nej. I henhold til dansk Købelov er afgivne bud bindende og kan ikke tilbagetrækkes.',
      },
      {
        q: 'Hvad er proxy-budgivning?',
        a: 'Med proxy-budgivning angiver du dit maksimale budget. Systemet byder automatisk for dig op til dette beløb, så du ikke behøver følge med konstant.',
      },
      {
        q: 'Hvad sker der hvis reserveprisen ikke nås?',
        a: 'Hvis det højeste bud er under reserveprisen, afsluttes auktionen uden salg. Sælger kan derefter vælge at acceptere det højeste bud eller relancere auktionen.',
      },
    ],
  },
  {
    label: 'For Sælgere',
    items: [
      {
        q: 'Hvor mange biler kan jeg sælge som privat?',
        a: 'Som privat sælger kan du sælge op til 2 biler om året uden at det betragtes som erhvervsmæssigt salg jf. SKATs regler.',
      },
      {
        q: 'Hvad er en reservepris?',
        a: 'Reserveprisen er den mindstepris du vil acceptere for din bil. Auktionen afsluttes kun som solgt, hvis buddet når reserveprisen.',
      },
      {
        q: 'Hvad koster det at sælge?',
        a: 'Det er gratis for private sælgere at oprette og afvikle auktioner på Next Auction.',
      },
      {
        q: 'Kan jeg annullere en auktion?',
        a: 'Ja, du kan annullere en auktion, så længe der ikke er afgivet bud. Når der er afgivet bud, kan auktionen som udgangspunkt ikke annulleres.',
      },
      {
        q: 'Hvad er kravene til billeder?',
        a: 'Upload mindst 3 billeder der viser bilens stand tydeligt — udefra, indefra og evt. eventuelle skader. God belysning og skarpe billeder øger interessen.',
      },
    ],
  },
  {
    label: 'Regler og betingelser',
    items: [
      {
        q: 'Er buddene juridisk bindende?',
        a: 'Ja, afgivne bud er bindende i henhold til dansk Købelov § 6. Vinderen af auktionen er forpligtet til at gennemføre købet til det afgivne budbeløb.',
      },
      {
        q: 'Hvem er ansvarlig for bilens stand?',
        a: 'Sælger er eneansvarlig for, at bilens beskrivelse og billeder er korrekte og ikke vildledende. Køber opfordres til at besigtige bilen inden budgivning.',
      },
      {
        q: 'Hvad er Next Auctions ansvar?',
        a: 'Next Auction er en formidlingsplatform og er ikke part i handlen mellem køber og sælger. Vi er ikke ansvarlige for bilens stand, pris eller handelsbetingelser.',
      },
      {
        q: 'Hvordan behandles mine persondata?',
        a: 'Vi behandler dine data i overensstemmelse med GDPR og dansk databeskyttelseslovgivning. Læs vores privatlivspolitik for detaljer.',
      },
      {
        q: 'Kan jeg kontakte sælger direkte?',
        a: 'Ja, du kan sende en besked til sælger via vores beskedsystem. Kontaktoplysninger deles kun med vinderen af auktionen.',
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
