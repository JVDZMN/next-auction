'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n/context'
import { locales, type Locale } from '@/lib/i18n'

const FLAGS: Record<Locale, string> = { da: '🇩🇰', en: '🇬🇧' }
const TITLES: Record<Locale, string> = { da: 'Dansk', en: 'English' }

export function LanguageSwitcher() {
  const locale   = useLocale()
  const pathname = usePathname()
  const router   = useRouter()

  function switchTo(next: Locale) {
    if (next === locale) return
    const stripped = pathname?.replace(new RegExp(`^/${locale}`), '') || '/'
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    router.push(`/${next}${stripped}`)
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded p-0.5"
      style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
    >
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          title={TITLES[l]}
          aria-label={TITLES[l]}
          className="flex h-7 w-8 items-center justify-center rounded text-base leading-none transition-colors"
          style={{
            backgroundColor: l === locale ? 'rgba(255,255,255,0.18)' : 'transparent',
            opacity: l === locale ? 1 : 0.45,
          }}
        >
          {FLAGS[l]}
        </button>
      ))}
    </div>
  )
}
