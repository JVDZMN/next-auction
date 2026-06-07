'use client'

import Link from 'next/link'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { LogOut, Menu } from 'lucide-react'

interface NavLink { label: string; href: string; count?: number }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  mobileLinks: NavLink[]
  isAuthenticated: boolean
  totalCount: number
  t: { openMenu: string; signOut: string; language: string }
  onSignOut: () => void
}

export function MobileSheet({ open, onOpenChange, mobileLinks, isAuthenticated, totalCount, t, onSignOut }: Props) {
  const closeSheet = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-white/75 hover:text-white hover:bg-white/8 transition-colors"
        aria-label={t.openMenu}
      >
        <Menu className="h-5 w-5" />
        {totalCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 min-w-4 inline-flex items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white tabular-nums" style={{ backgroundColor: 'var(--copper)' }}>
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="p-0 flex flex-col"
        style={{ backgroundColor: 'var(--dark-section)', width: '80vw', maxWidth: '320px' }}
      >
        <div
          className="flex items-center px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="text-lg font-black text-white">
            Next<span style={{ color: 'var(--copper)' }}>Auction</span>
          </span>
        </div>

        <nav className="flex flex-col px-3 py-4 gap-0.5 flex-1 overflow-y-auto">
          {mobileLinks.map(({ label, href, count }) => (
            <Link
              key={href}
              href={href}
              onClick={closeSheet}
              className="flex items-center justify-between h-11 px-3 rounded-md text-base font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.70)' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'white')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.70)')}
            >
              {label}
              {count && count > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white tabular-nums" style={{ backgroundColor: 'var(--copper)' }}>
                  {count > 99 ? '99+' : count}
                </span>
              ) : null}
            </Link>
          ))}

          {isAuthenticated && (
            <>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '8px 0' }} />
              <button
                onClick={() => { closeSheet(); onSignOut() }}
                className="flex items-center h-11 px-3 rounded-md text-base font-medium text-left transition-colors"
                style={{ color: 'rgba(255,80,80,0.85)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgb(255,80,80)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,80,80,0.85)')}
              >
                <LogOut className="mr-2.5 h-4 w-4" /> {t.signOut}
              </button>
            </>
          )}
        </nav>

        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>
            {t.language}
          </span>
          <LanguageSwitcher />
        </div>
      </SheetContent>
    </Sheet>
  )
}
