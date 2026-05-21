'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n/context'
import { locales, type Locale } from '@/lib/i18n'

const labels: Record<Locale, string> = {
  da: 'DA',
  en: 'EN',
}

export function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function switchTo(next: Locale) {
    if (next === locale) return

    // Replace the leading /<locale> segment with the new locale.
    // pathname is always like "/da/cars/123" under [locale] routing.
    const stripped = pathname.replace(new RegExp(`^/${locale}`), '') || '/'
    const newPath = `/${next}${stripped}`

    // Persist so the middleware remembers the choice on future visits.
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`

    router.push(newPath)
  }

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-gray-200 overflow-hidden text-xs font-semibold">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          className={`px-2 py-1 transition-colors ${
            l === locale
              ? 'bg-stone-900 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-100'
          }`}
          aria-current={l === locale ? 'true' : undefined}
        >
          {labels[l]}
        </button>
      ))}
    </div>
  )
}
