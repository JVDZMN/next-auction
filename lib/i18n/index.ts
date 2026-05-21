export type Locale = 'da' | 'en'

export const locales = ['da', 'en'] as const satisfies readonly Locale[]
export const defaultLocale: Locale = 'da'

// Dictionary type is derived from the English file — TypeScript will catch
// any key missing from da.json at build time if you add a strict equality check.
export type Dictionary = typeof import('../../dictionaries/en.json')

// Dynamic import so each locale's JSON is only loaded when needed.
// Next.js bundles these at build time via static analysis of the template literal.
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  switch (locale) {
    case 'da': return (await import('../../dictionaries/da.json')).default as unknown as Dictionary
    case 'en': return (await import('../../dictionaries/en.json')).default as unknown as Dictionary
  }
}

// Narrow an arbitrary string to a valid Locale, falling back to default.
export function toLocale(value: unknown): Locale {
  if (value === 'da' || value === 'en') return value
  return defaultLocale
}
