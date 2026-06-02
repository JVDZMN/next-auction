import Link from 'next/link'
import { toLocale } from '@/lib/i18n'

export const metadata = {
  title: 'Vilkår og betingelser – Next Auction',
  description: 'Læs vilkår og betingelser for brug af Next Auction platformen.',
}

const SECTIONS = [
  {
    id: '1',
    title: 'Hvem er vi',
    body: `Next Auction er en dansk digital auktionsplatform, der formidler køb og salg af motorkøretøjer mellem private og erhvervssælgere. Vi er ikke part i handlen og sælger ikke biler selv. Platformen understøtter både forbrugersalg (C2C) og erhvervssalg (B2B).`,
  },
  {
    id: '2',
    title: 'Brugertyper',
    body: `Next Auction har to brugertyper:

**Private sælgere** kan sælge op til 2 køretøjer pr. kalenderår uden CVR-nummer. Salg ud over denne grænse kan betragtes som erhvervsmæssigt af SKAT, og det er sælgers eget ansvar at overholde gældende skatteregler.

**Erhvervssælgere** skal opgive gyldigt CVR-nummer ved registrering. Erhvervssalg er underlagt særskilte regler og er synligt mærket på platformen, så køber altid kan identificere selgerens type.`,
  },
  {
    id: '3',
    title: 'Budgivningsregler',
    body: `Alle bud afgivet på Next Auction er juridisk bindende i henhold til dansk Købelov § 6. Ved at afgive et bud accepterer du at gennemføre købet til det afgivne beløb, såfremt du vinder auktionen og reserveprisen er nået.

Bud kan ikke tilbagetrækkes efter afgivelse. Afsluttede auktioner med opnået reservepris resulterer i en bindende aftale mellem køber og sælger.`,
  },
  {
    id: '4',
    title: 'Sælgers ansvar',
    body: `Sælger er eneansvarlig for, at oplysningerne i annoncen — herunder beskrivelse, kilometerstand, stand og billeder — er korrekte, retvisende og ikke vildledende.

Sælger er ansvarlig for at oplyse om kendte fejl og mangler. Manglende oplysning kan udgøre en overtrædelse af markedsføringsloven og/eller købeloven.`,
  },
  {
    id: '5',
    title: 'Købers ansvar',
    body: `Køber opfordres til at besigtige køretøjet inden budgivning. Next Auction anbefaler, at køber indhenter en professionel tilstandsrapport eller alternativt betinger handlen af en prøvetur og/eller syn.

Bud afgives på eget ansvar. Køber kan ikke hæve et vundet bud med baggrund i forhold, der burde have været undersøgt inden budgivning.`,
  },
  {
    id: '6',
    title: 'Next Auctions ansvar',
    body: `Next Auction stiller en teknisk platform til rådighed og er ikke part i handlen mellem køber og sælger. Vi påtager os intet ansvar for:

- Køretøjets stand, beskrivelse eller pris
- Eventuelle tvister mellem køber og sælger
- Tab som følge af handler indgået via platformen

Vi forbeholder os ret til at slette annoncer eller suspendere brugere, der overtræder disse vilkår.`,
  },
  {
    id: '7',
    title: 'GDPR og databeskyttelse',
    body: `Next Auction behandler personoplysninger i overensstemmelse med Europa-Parlamentets og Rådets forordning (EU) 2016/679 (GDPR) samt dansk databeskyttelseslov.

Vi indsamler og behandler kun de personoplysninger, der er nødvendige for at levere vores tjeneste. Vi videregiver ikke dine oplysninger til tredjepart uden dit samtykke, medmindre vi er forpligtet hertil ved lov.

Læs vores fulde privatlivspolitik for detaljer om dine rettigheder og vores behandling af data.`,
  },
  {
    id: '8',
    title: 'Kontakt',
    body: `Har du spørgsmål til disse vilkår, er du velkommen til at kontakte os:

Next Auction
E-mail: support@next-auction.dk

Vilkårene er sidst opdateret: 1. juni 2026.`,
  },
]

export default async function TermsPage({
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
            Juridisk
          </p>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Vilkår og betingelser
          </h1>
          <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Senest opdateret: 1. juni 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 sm:px-10 py-16 sm:py-20">
        {/* Table of contents */}
        <nav className="mb-12 rounded-xl border p-6" style={{ borderColor: 'rgba(0,0,0,0.08)', backgroundColor: 'white' }}>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--copper)' }}>Indhold</p>
          <ol className="flex flex-col gap-2">
            {SECTIONS.map(s => (
              <li key={s.id}>
                <a
                  href={`#section-${s.id}`}
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text-body)' }}
                >
                  {s.id}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col gap-12">
          {SECTIONS.map(s => (
            <section key={s.id} id={`section-${s.id}`}>
              <h2 className="mb-4 text-xl font-black" style={{ color: 'var(--text-body)' }}>
                <span style={{ color: 'var(--copper)' }}>{s.id}.</span> {s.title}
              </h2>
              <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-muted)' }}>
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link href={`/${locale}/privacy`} className="hover:opacity-70 transition-opacity" style={{ color: 'var(--copper)' }}>
            Privatlivspolitik →
          </Link>
          <Link href={`/${locale}/faq`} className="hover:opacity-70 transition-opacity" style={{ color: 'var(--copper)' }}>
            FAQ →
          </Link>
        </div>
      </div>
    </main>
  )
}
