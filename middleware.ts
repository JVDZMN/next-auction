import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale, type Locale } from '@/lib/i18n'

const COOKIE = 'NEXT_LOCALE'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

// Parse Accept-Language header and return the best matching locale.
// Handles tags like "da-DK,da;q=0.9,en-US;q=0.8,en;q=0.7"
function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale

  const preferred = acceptLanguage
    .split(',')
    .map(entry => {
      const [tag, q] = entry.trim().split(';q=')
      return { lang: tag.trim().slice(0, 2).toLowerCase(), q: q ? parseFloat(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)
    .map(e => e.lang)
    .find(lang => locales.includes(lang as Locale))

  return (preferred as Locale | undefined) ?? defaultLocale
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Pass through paths that should never be locale-prefixed ──────────
  const pathnameHasLocale = locales.some(
    locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )
  if (pathnameHasLocale) return NextResponse.next()

  // ── 2. Determine locale: cookie → Accept-Language → default ─────────────
  const cookieLocale = request.cookies.get(COOKIE)?.value
  const locale: Locale =
    cookieLocale && locales.includes(cookieLocale as Locale)
      ? (cookieLocale as Locale)
      : negotiateLocale(request.headers.get('accept-language'))

  // ── 3. Redirect to /<locale>/<rest-of-path> ──────────────────────────────
  request.nextUrl.pathname = `/${locale}${pathname}`
  const response = NextResponse.redirect(request.nextUrl)

  // Persist the negotiated locale in a cookie so subsequent visits skip
  // detection (respects user's manual language switch too).
  response.cookies.set(COOKIE, locale, {
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
    path: '/',
  })

  return response
}

export const config = {
  // Run on every path EXCEPT: API routes, Next.js internals, static assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
