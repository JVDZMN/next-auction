import Link from 'next/link'
import { toLocale } from '@/lib/i18n'

export const metadata = {
  title: 'Privatlivspolitik – Next Auction',
  description: 'Læs om hvordan Next Auction behandler dine personoplysninger.',
}

const SECTIONS = [
  {
    id: '1',
    title: 'Dataansvarlig',
    body: `Next Auction er dataansvarlig for de personoplysninger, vi indsamler via platformen.

Kontakt: support@next-auction.dk`,
  },
  {
    id: '2',
    title: 'Hvilke oplysninger indsamler vi?',
    body: `Vi indsamler følgende kategorier af personoplysninger:

- **Kontaktoplysninger:** navn og e-mailadresse ved oprettelse af konto
- **Profiloplysninger:** oplysninger du selv angiver i din profil
- **Transaktionsdata:** oplysninger om dine bud og auktioner
- **Tekniske data:** IP-adresse, browser, enhedstype og cookie-data til teknisk drift og sikkerhed
- **Kommunikation:** beskeder sendt via vores beskedsystem`,
  },
  {
    id: '3',
    title: 'Formål og retsgrundlag',
    body: `Vi behandler dine oplysninger til følgende formål:

- **Levering af tjenesten** (GDPR art. 6, stk. 1, litra b — opfyldelse af aftale): oprettelse og drift af din konto, budgivning og auktioner
- **Sikkerhed og misbrug** (GDPR art. 6, stk. 1, litra f — legitim interesse): beskyttelse af platformen mod svindel og misbrug
- **Juridiske forpligtelser** (GDPR art. 6, stk. 1, litra c): opbevaring af oplysninger krævet af dansk regnskabs- og skattelovgivning
- **Markedsføring** (GDPR art. 6, stk. 1, litra a — samtykke): nyhedsbrev og opdateringer, kun med dit udtrykkelige samtykke`,
  },
  {
    id: '4',
    title: 'Opbevaring',
    body: `Vi opbevarer dine oplysninger så længe din konto er aktiv, og i op til 5 år efter din konto er slettet i overensstemmelse med bogføringsloven.

Tekniske logs slettes løbende og opbevares maksimalt i 90 dage.`,
  },
  {
    id: '5',
    title: 'Videregivelse til tredjepart',
    body: `Vi videregiver ikke dine personoplysninger til tredjepart uden dit samtykke, medmindre vi er forpligtet hertil ved lov.

Vi anvender følgende databehandlere til at levere tjenesten:
- **Vercel** (hosting og serverless-funktioner) — USA, med EU-standardkontrakter
- **Neon** (databasehosting) — EU
- **Cloudinary** (billedlager) — USA, med EU-standardkontrakter
- **Resend** (transaktionsmails) — USA, med EU-standardkontrakter
- **Upstash** (cacheing) — EU`,
  },
  {
    id: '6',
    title: 'Dine rettigheder',
    body: `Du har i henhold til GDPR følgende rettigheder:

- **Indsigtsret:** du kan til enhver tid bede om at se de oplysninger vi har om dig
- **Berigtigelse:** du kan bede os rette forkerte oplysninger
- **Sletning:** du kan bede os slette dine oplysninger, med forbehold for lovpligtig opbevaring
- **Begrænsning:** du kan i visse tilfælde bede om begrænsning af behandlingen
- **Dataportabilitet:** du kan modtage dine data i et maskinlæsbart format
- **Indsigelse:** du kan gøre indsigelse mod behandling baseret på legitim interesse

For at udøve dine rettigheder, kontakt os på support@next-auction.dk. Vi svarer inden for 30 dage.`,
  },
  {
    id: '7',
    title: 'Cookies',
    body: `Next Auction anvender cookies til teknisk drift af platformen (session, autentificering). Disse cookies er nødvendige og kræver ikke samtykke.

Vi anvender ikke tracking-cookies eller tredjeparts annoncecookies.`,
  },
  {
    id: '8',
    title: 'Klage',
    body: `Har du indsigelser mod vores behandling af dine personoplysninger, kan du klage til:

Datatilsynet
Carl Jacobsens Vej 35
2500 Valby
www.datatilsynet.dk

Vi opfordrer dig dog til at kontakte os først, så vi kan løse eventuelle problemer direkte.`,
  },
]

export default async function PrivacyPage({
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
            GDPR
          </p>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Privatlivspolitik
          </h1>
          <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Senest opdateret: 1. juni 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 sm:px-10 py-16 sm:py-20">
        {/* Intro */}
        <p className="mb-12 text-base leading-relaxed rounded-xl border p-6" style={{ borderColor: 'rgba(196,125,58,0.3)', backgroundColor: 'rgba(196,125,58,0.05)', color: 'var(--text-body)' }}>
          Vi tager dit privatliv alvorligt. Denne politik forklarer i klart sprog, hvilke oplysninger vi indsamler,
          hvorfor vi indsamler dem, og hvilke rettigheder du har.
        </p>

        {/* Table of contents */}
        <nav className="mb-12 rounded-xl border p-6" style={{ borderColor: 'rgba(0,0,0,0.08)', backgroundColor: 'white' }}>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--copper)' }}>Indhold</p>
          <ol className="flex flex-col gap-2">
            {SECTIONS.map(s => (
              <li key={s.id}>
                <a href={`#section-${s.id}`} className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-body)' }}>
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

        <div className="mt-14 flex flex-wrap gap-4 text-sm">
          <Link href={`/${locale}/terms`} className="hover:opacity-70 transition-opacity" style={{ color: 'var(--copper)' }}>
            Vilkår og betingelser →
          </Link>
          <Link href={`/${locale}/faq`} className="hover:opacity-70 transition-opacity" style={{ color: 'var(--copper)' }}>
            FAQ →
          </Link>
        </div>
      </div>
    </main>
  )
}
