'use client'

// DictionaryProvider lives here so it can be imported in the server layout
// (which cannot itself carry 'use client').  The server layout passes the
// already-resolved dictionary as a plain prop — no async work happens here.

import { createContext, useContext } from 'react'
import type { Dictionary, Locale } from './index'

interface LocaleContextValue {
  locale: Locale
  dict: Dictionary
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function DictionaryProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale
  dict: Dictionary
  children: React.ReactNode
}) {
  return (
    <LocaleContext.Provider value={{ locale, dict }}>
      {children}
    </LocaleContext.Provider>
  )
}

// Throw if called outside provider — makes misconfiguration obvious at dev time.
export function useDict(): Dictionary {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useDict() must be used inside <DictionaryProvider>')
  return ctx.dict
}

export function useLocale(): Locale {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale() must be used inside <DictionaryProvider>')
  return ctx.locale
}
