import Link from 'next/link'
import { getDictionary, toLocale } from '@/lib/i18n'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const dict = await getDictionary(toLocale(rawLocale))
  return {
    title: dict.terms.metaTitle,
    description: dict.terms.metaDescription,
  }
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = toLocale(rawLocale)
  const dict = await getDictionary(locale)
  const t = dict.terms

  return (
    <main style={{ backgroundColor: 'var(--page-bg)', minHeight: '100vh' }}>
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
          <Link
            href={`/${locale}`}
            className="mb-6 inline-block text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: 'rgba(243,240,236,0.7)' }}
          >
            {t.backHome}
          </Link>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>
            {t.label}
          </p>
          <h1 className="text-4xl font-black sm:text-5xl" style={{ color: 'var(--page-bg)' }}>
            {t.heading}
          </h1>
          <p className="mt-4 text-sm" style={{ color: 'rgba(243,240,236,0.6)' }}>
            {t.lastUpdated}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 sm:px-10 py-16 sm:py-20">
        <nav className="mb-12 rounded-xl border p-6" style={{ borderColor: 'rgba(0,0,0,0.08)', backgroundColor: 'white' }}>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--copper)' }}>
            {t.tableOfContents}
          </p>
          <ol className="flex flex-col gap-2">
            {t.sections.map(s => (
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
          {t.sections.map(s => (
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
          <Link href={`/${locale}/privacy`} className="hover:opacity-70 transition-opacity" style={{ color: 'var(--copper)' }}>
            {t.linkPrivacy}
          </Link>
          <Link href={`/${locale}/faq`} className="hover:opacity-70 transition-opacity" style={{ color: 'var(--copper)' }}>
            {t.linkFaq}
          </Link>
        </div>
      </div>
    </main>
  )
}
