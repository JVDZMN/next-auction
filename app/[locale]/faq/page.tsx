import Link from 'next/link'
import { getDictionary, toLocale } from '@/lib/i18n'
import type { Metadata } from 'next'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { CornerAccent } from '@/components/home/CornerAccent'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const dict = await getDictionary(toLocale(rawLocale))
  return {
    title: dict.faqPage.metaTitle,
    description: dict.faqPage.metaDescription,
  }
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = toLocale(rawLocale)
  const dict = await getDictionary(locale)
  const t = dict.faqPage

  return (
    <main style={{ backgroundColor: 'var(--page-bg)', minHeight: '100vh' }}>
      <div style={{ backgroundColor: 'var(--dark-section)' }} className="relative overflow-hidden py-20 sm:py-28">
        <CornerAccent position="top-right" color="copper" />
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
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 sm:px-10 py-16 sm:py-20">
        <div className="flex flex-col gap-14">
          {t.categories.map(cat => (
            <section key={cat.label}>
              <h2 className="mb-6 text-xl font-black" style={{ color: 'var(--text-body)' }}>
                <span
                  className="mr-2 inline-block h-1 w-8 align-middle rounded-full"
                  style={{ backgroundColor: 'var(--copper)' }}
                />
                {cat.label}
              </h2>

              <Accordion
                multiple
                className="flex flex-col divide-y rounded-xl border overflow-hidden"
                style={{ borderColor: 'rgba(0,0,0,0.08)' }}
              >
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
          <p className="mb-2 text-base font-black text-white">{t.contactHeading}</p>
          <p className="mb-5 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {t.contactBody}
          </p>
          <a
            href="mailto:support@next-auction.dk"
            className="inline-block rounded px-6 py-3 text-sm font-bold text-white hover:scale-105 transition-transform duration-150"
            style={{ backgroundColor: 'var(--copper)' }}
          >
            {t.contactCta}
          </a>
        </div>
      </div>
    </main>
  )
}
