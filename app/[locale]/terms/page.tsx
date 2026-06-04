import Link from 'next/link'
import { toLocale } from '@/lib/i18n'

export const metadata = {
  title: 'Vilkår og betingelser – Next Auction',
  description: 'Læs vilkår og betingelser for brug af Next Auction platformen.',
}

const SECTIONS = [
  {
    id: '1',
    title: 'Om Next Auction',
    body: `Next Auction er en digital formidlingsplatform for køb og salg af køretøjer. Vi er ikke part i handlen mellem køber og sælger.`,
  },
  {
    id: '2',
    title: 'Platformens rolle',
    body: `Next Auction stiller alene en teknisk platform til rådighed. Alle handler indgås direkte mellem køber og sælger uden Next Auctions mellemkomst.

Next Auction påtager sig intet ansvar for:
- Køretøjets stand, kilometerstand eller historik
- Sælgers oplysningers rigtighed
- Handelens gennemførelse
- Eventuelle tvister mellem køber og sælger`,
  },
  {
    id: '3',
    title: 'Brugertyper',
    body: `Private brugere kan sælge op til 2 biler pr. kalenderår i overensstemmelse med SKATs regler for private salg. Salg ud over denne grænse betragtes som erhvervsmæssigt af SKAT.

Erhvervsbrugere skal have gyldigt CVR-nummer og skal godkendes af en administrator inden adgang til erhvervsmarkedet.`,
  },
  {
    id: '4',
    title: 'Budgivningsregler',
    body: `Afgivne bud er juridisk bindende i henhold til dansk Købelov § 6. Ved at afgive et bud forpligter budgiver sig til at købe køretøjet til den pågældende pris, hvis budet er det højeste ved auktionens afslutning.

Bud kan ikke tilbagetrækkes efter afgivelse.`,
  },
  {
    id: '5',
    title: 'Sælgers ansvar',
    body: `Sælger er eneansvarlig for:
- Annoncens indhold og rigtighed
- Lovlig ejendomsret til køretøjet
- Korrekt beskrivelse af køretøjets stand`,
  },
  {
    id: '6',
    title: 'Købers ansvar',
    body: `Køber opfordres til at:
- Besigtige køretøjet inden budafgivelse
- Indhente uafhængig teknisk vurdering
- Tjekke køretøjets historik (tjekbil.dk)

Køb sker på købers eget ansvar.`,
  },
  {
    id: '7',
    title: 'Forbudt indhold',
    body: `Følgende er ikke tilladt på platformen:
- Falske eller vildledende oplysninger
- Salg af stjålne køretøjer
- Manipulation af budprocessen

Overtrædelse medfører øjeblikkelig udelukkelse fra platformen.`,
  },
  {
    id: '8',
    title: 'GDPR og data',
    body: `Next Auction behandler dine personoplysninger i overensstemmelse med GDPR og dansk databeskyttelseslov. Læs vores privatlivspolitik for detaljer om indsamling, opbevaring og dine rettigheder.`,
  },
  {
    id: '9',
    title: 'Kontakt',
    body: `Har du spørgsmål til disse vilkår, er du velkommen til at kontakte os:

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
          <Link href={`/${locale}/faq`} className="hover:opacity-70 transition-opacity" style={{ color: 'var(--copper)' }}>
            FAQ →
          </Link>
        </div>
      </div>
    </main>
  )
}
