'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/context'
import { useNotifications } from '@/lib/notification-context'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Shield, LogOut, BadgeCheck, Menu } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const NAV_LINK = 'px-3 py-1.5 rounded text-sm font-medium transition-colors'
const NAV_LINK_STYLE = { color: 'rgba(255,255,255,0.65)' }

export function Header() {
  const { data: session, status } = useSession()
  const locale        = useLocale()
  const isAdmin       = session?.user?.role === 'Admin'
  const isPrivate     = session?.user?.userType === 'PRIVATE'
  const isBusiness    = session?.user?.userType === 'BUSINESS'
  const { totalCount } = useNotifications()
  const [sheetOpen, setSheetOpen] = useState(false)

  const initials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const closeSheet = () => setSheetOpen(false)

  // Mobile nav links — context-aware
  const mobileLinks: { label: string; href: string }[] = session
    ? [
        ...(isBusiness
          ? [
              { label: 'Se erhvervsbiler', href: `/${locale}/cars` },
              { label: 'Forhandlere',      href: `/${locale}/dealers` },
            ]
          : [{ label: 'Se biler', href: `/${locale}/cars` }]),
        {
          label: isAdmin ? 'Admin' : (isBusiness ? 'Min virksomhed' : 'Min konto'),
          href:  isAdmin ? `/${locale}/admin/dashboard` : `/${locale}/dashboard`,
        },
        { label: 'Opret bil', href: `/${locale}/cars/create` },
      ]
    : [
        { label: 'Se biler',     href: `/${locale}/cars` },
        { label: 'Forhandlere',  href: `/${locale}/dealers` },
        { label: 'Log ind',      href: `/${locale}/auth/signin` },
        { label: 'Opret konto',  href: `/${locale}/auth/signup` },
      ]

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{ backgroundColor: 'var(--dark-section)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4">

        {/* Logo */}
        <Link href={`/${locale}`} className="select-none text-lg font-black tracking-tight text-white">
          Next<span style={{ color: 'var(--copper)' }}>Auction</span>
        </Link>

        {/* Desktop nav — lg and above */}
        <nav className="hidden lg:flex items-center gap-0.5">
          <Link href={`/${locale}/cars`} className={NAV_LINK} style={NAV_LINK_STYLE}
            onMouseEnter={e => ((e.target as HTMLElement).style.color = 'white')}
            onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}
          >
            {isBusiness ? 'Se erhvervsbiler' : 'Se biler'}
          </Link>
          {!isPrivate && (
            <Link href={`/${locale}/dealers`} className={NAV_LINK} style={NAV_LINK_STYLE}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = 'white')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}
            >
              Forhandlere
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
              {isAdmin ? 'Admin' : (isBusiness ? 'Min virksomhed' : 'Min konto')}
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
          {isAdmin && (
            <Link href={`/${locale}/admin/dashboard`} className={cn(NAV_LINK, 'inline-flex items-center gap-1')} style={NAV_LINK_STYLE}>
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </nav>

        {/* Desktop right — lg and above */}
        <div className="hidden lg:flex items-center gap-2">
          <LanguageSwitcher />
          <Separator orientation="vertical" className="h-5 bg-white/15" />

          {status === 'loading' ? (
            <Skeleton className="h-8 w-24 rounded-md bg-white/10" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-2 px-2 h-8 rounded-md text-sm font-medium text-white/75 hover:text-white hover:bg-white/8 transition-colors cursor-pointer">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? 'User'} />
                  <AvatarFallback className="text-xs bg-white/15 text-white">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium max-w-30 truncate">
                  {session.user?.name || session.user?.email}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium truncate">{session.user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href={isAdmin ? `/${locale}/admin/dashboard` : `/${locale}/dashboard`} />}>
                  {isAdmin ? 'Admin Dashboard' : (isBusiness ? 'Min virksomhed' : 'Min konto')}
                </DropdownMenuItem>
                {(session.user as { mitIdVerified?: boolean }).mitIdVerified ? (
                  <DropdownMenuItem disabled>
                    <BadgeCheck className="mr-2 h-4 w-4" style={{ color: 'var(--brand)' }} />
                    <span style={{ color: 'var(--brand)' }}>MitID Verified</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => { window.location.href = '/api/mitid/start' }}>
                    <span className="mr-2">🇩🇰</span> Verify with MitID
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log ud
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/${locale}/auth/signin`}
                className="rounded px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              >
                Log ind
              </Link>
              <Link
                href={`/${locale}/auth/signup`}
                className="rounded px-4 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-85"
                style={{ backgroundColor: 'var(--copper)' }}
              >
                Opret konto
              </Link>
            </div>
          )}
        </div>

        {/* Mobile right — below lg */}
        <div className="flex lg:hidden items-center gap-1">
          {totalCount > 0 && (
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white tabular-nums"
              style={{ backgroundColor: 'var(--copper)' }}
            >
              {totalCount > 99 ? '99+' : totalCount}
            </span>
          )}

          <Sheet open={sheetOpen} onOpenChange={(open) => setSheetOpen(open)}>
            <SheetTrigger
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-white/75 hover:text-white hover:bg-white/8 transition-colors"
              aria-label="Åbn menu"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>

            <SheetContent
              side="right"
              className="p-0 flex flex-col"
              style={{ backgroundColor: 'var(--dark-section)', width: '80vw', maxWidth: '320px' }}
            >
              {/* Sheet header */}
              <div
                className="flex items-center px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-lg font-black text-white">
                  Next<span style={{ color: 'var(--copper)' }}>Auction</span>
                </span>
              </div>

              {/* Nav links */}
              <nav className="flex flex-col px-3 py-4 gap-0.5 flex-1 overflow-y-auto">
                {mobileLinks.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeSheet}
                    className="flex items-center h-11 px-3 rounded-md text-base font-medium transition-colors"
                    style={{ color: 'rgba(255,255,255,0.70)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.70)')}
                  >
                    {label}
                  </Link>
                ))}

                {session && (
                  <>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '8px 0' }} />
                    <button
                      onClick={() => { closeSheet(); signOut() }}
                      className="flex items-center h-11 px-3 rounded-md text-base font-medium text-left transition-colors"
                      style={{ color: 'rgba(255,80,80,0.85)' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgb(255,80,80)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,80,80,0.85)')}
                    >
                      <LogOut className="mr-2.5 h-4 w-4" /> Log ud
                    </button>
                  </>
                )}
              </nav>

              {/* Footer: language switcher */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  Sprog
                </span>
                <LanguageSwitcher />
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  )
}
