'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/context'
import { useNotifications } from '@/lib/notification-context'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Shield, LogOut, BadgeCheck } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function Header() {
  const { data: session, status } = useSession()
  const locale  = useLocale()
  const isAdmin = session?.user?.role === 'Admin'
  const { totalCount } = useNotifications()

  const initials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4">

        {/* Logo */}
        <Link href={`/${locale}`} className="text-lg font-bold tracking-tight">
          Next Auction
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link href={`/${locale}/cars`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Browse Cars
          </Link>
          <Link
            href={`/${locale}/dashboard`}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5')}
          >
            {isAdmin ? 'Admin' : 'Dashboard'}
            {totalCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white tabular-nums">
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
          </Link>
          {isAdmin && (
            <Link href={`/${locale}/admin/dashboard`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-purple-600 hover:text-purple-700')}>
              <Shield className="h-3.5 w-3.5 mr-1" /> Admin
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <Separator orientation="vertical" className="h-5" />

          {/* Auth area */}
          {status === 'loading' ? (
            <Skeleton className="h-8 w-24 rounded-md" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-2 px-2 h-8 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? 'User'} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium max-w-30 truncate">
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
                  Dashboard
                </DropdownMenuItem>
                {(session.user as { mitIdVerified?: boolean }).mitIdVerified ? (
                  <DropdownMenuItem disabled>
                    <BadgeCheck className="mr-2 h-4 w-4 text-green-600" />
                    <span className="text-green-600">MitID Verified</span>
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
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => signIn()}>Sign In</Button>
          )}
        </div>
      </div>
    </header>
  )
}
