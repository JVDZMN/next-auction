'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n/context'
import { locales, type Locale } from '@/lib/i18n'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const labels: Record<Locale, string> = { da: 'DA', en: 'EN' }

export function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function switchTo(next: Locale) {
    if (!next || next === locale) return
    const stripped = pathname?.replace(new RegExp(`^/${locale}`), '') || '/'
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    router.push(`/${next}${stripped}`)
  }

  return (
    <ToggleGroup
      value={[locale]}
      onValueChange={(v) => { if (v.length > 0) switchTo(v[0] as Locale) }}
      className="h-8 rounded-md border bg-background p-0.5 gap-0"
    >
      {locales.map((l) => (
        <ToggleGroupItem
          key={l}
          value={l}
          size="sm"
          className="h-6 px-2 text-xs font-semibold data-[state=on]:bg-foreground data-[state=on]:text-background rounded-sm"
        >
          {labels[l]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
