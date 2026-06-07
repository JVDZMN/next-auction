'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useLocale, useDict } from '@/lib/i18n/context'
import { useNotifications } from '@/lib/notification-context'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { UserMenu } from '@/components/header/UserMenu'
import { MobileSheet } from '@/components/header/MobileSheet'

const NAV_LINK = 'px-3 py-1.5 rounded text-sm font-medium transition-colors'
const NAV_LINK_STYLE = { color: 'rgba(255,255,255,0.65)' }

export function Header() {
  const { data: session, status } = useSession()
  const locale        = useLocale()
  const t             = useDict().nav
  const isAdmin       = session?.user?.role === 'ADMIN'
  const isBusiness    = session?.user?.role === 'BUSINESS_USER'
  const { totalCount } = useNotifications()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const mobileLinks: { label: string; href: string; count?: number }[] = session
    ? [
        ...(isBusiness
          ? [
              { label: t.browseBusiness, href: `/${locale}/cars` },
              { label: t.dealers,        href: `/${locale}/dealers` },
            ]
          : [{ label: t.browseCars, href: `/${locale}/cars` }]),
        {
          label: isAdmin ? t.admin : (isBusiness ? t.myBusiness : t.myAccount),
          href:  isAdmin ? `/${locale}/admin/dashboard` : `/${locale}/dashboard`,
          count: totalCount > 0 ? totalCount : undefined,
        },
        { label: t.createListing, href: `/${locale}/cars/create` },
      ]
    : [
        { label: t.browseCars, href: `/${locale}/cars` },
        { label: t.signIn,     href: `/${locale}/auth/signin` },
        { label: t.signUp,     href: `/${locale}/auth/signup` },
      ]

  return (
    <header
      className="fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out"
      style={{
        background: isScrolled ? 'rgba(18,37,53,0.92)' : 'rgba(18,37,53,0.55)',
        backdropFilter: isScrolled ? 'blur(14px)' : 'blur(6px)',
        WebkitBackdropFilter: isScrolled ? 'blur(14px)' : 'blur(6px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: isScrolled ? '0 4px 24px rgba(0,0,0,0.2)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4">

        <Link href={`/${locale}`} className="select-none text-lg font-black tracking-tight text-white">
          Next<span style={{ color: 'var(--copper)' }}>Auction</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          <Link href={`/${locale}/cars`} className={NAV_LINK} style={NAV_LINK_STYLE}
            onMouseEnter={e => ((e.target as HTMLElement).style.color = 'white')}
            onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}
          >
            {isBusiness ? t.browseBusiness : t.browseCars}
          </Link>
          {(isBusiness || isAdmin) && (
            <Link href={`/${locale}/dealers`} className={NAV_LINK} style={NAV_LINK_STYLE}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = 'white')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}
            >
              {t.dealers}
            </Link>
          )}
          {session && (
            <Link
              href={isAdmin ? `/${locale}/admin/dashboard` : `/${locale}/dashboard`}
              className={cn(NAV_LINK, 'inline-flex items-center gap-1.5')}
              style={NAV_LINK_STYLE}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}
            >
              {isAdmin ? t.admin : (isBusiness ? t.myBusiness : t.myAccount)}
              {totalCount > 0 && (
                <span
                  className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white tabular-nums"
                  style={{ backgroundColor: 'var(--copper)' }}
                >
                  {totalCount > 99 ? '99+' : totalCount}
                </span>
              )}
            </Link>
          )}
        </nav>

        {/* Desktop right */}
        <div className="hidden lg:flex items-center gap-2">
          <LanguageSwitcher />
          <Separator orientation="vertical" className="h-5 bg-white/15" />

          {status === 'loading' ? (
            <Skeleton className="h-8 w-24 rounded-md bg-white/10" />
          ) : session ? (
            <UserMenu
              user={{
                name:          session.user?.name,
                email:         session.user?.email,
                image:         session.user?.image,
                mitIdVerified: (session.user as { mitIdVerified?: boolean }).mitIdVerified,
              }}
              isAdmin={isAdmin}
              isBusiness={isBusiness}
              locale={locale}
              t={t}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/${locale}/auth/signin`}
                className="rounded px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              >
                {t.signIn}
              </Link>
              <Link
                href={`/${locale}/auth/signup`}
                className="rounded px-4 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-85"
                style={{ backgroundColor: 'var(--copper)' }}
              >
                {t.signUp}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile right */}
        <div className="flex lg:hidden items-center gap-1">
          <MobileSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            mobileLinks={mobileLinks}
            isAuthenticated={!!session}
            totalCount={totalCount}
            t={t}
            onSignOut={() => signOut()}
          />
        </div>

      </div>
    </header>
  )
}
