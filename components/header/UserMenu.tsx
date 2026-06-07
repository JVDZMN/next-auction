'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, BadgeCheck } from 'lucide-react'

interface UserData {
  name?: string | null
  email?: string | null
  image?: string | null
  mitIdVerified?: boolean
}

interface NavDict {
  adminDashboard: string
  myBusiness: string
  myAccount: string
  verifyMitId: string
  mitIdVerified: string
  signOut: string
}

interface Props {
  user: UserData
  isAdmin: boolean
  isBusiness: boolean
  locale: string
  t: NavDict
}

export function UserMenu({ user, isAdmin, isBusiness, locale, t }: Props) {
  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 px-2 h-8 rounded-md text-sm font-medium text-white/75 hover:text-white hover:bg-white/8 transition-colors cursor-pointer">
        <Avatar className="h-7 w-7">
          <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'User'} />
          <AvatarFallback className="text-xs bg-white/15 text-white">{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium max-w-30 truncate">
          {user.name || user.email}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={isAdmin ? `/${locale}/admin/dashboard` : `/${locale}/dashboard`} />}>
          {isAdmin ? t.adminDashboard : (isBusiness ? t.myBusiness : t.myAccount)}
        </DropdownMenuItem>
        {user.mitIdVerified ? (
          <DropdownMenuItem disabled>
            <BadgeCheck className="mr-2 h-4 w-4" style={{ color: 'var(--brand)' }} />
            <span style={{ color: 'var(--brand)' }}>{t.mitIdVerified}</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => { window.location.href = '/api/mitid/start' }}>
            <span className="mr-2">🇩🇰</span> {t.verifyMitId}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" /> {t.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
