'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotifications } from '@/lib/notification-context'
import { useLocale, useDict } from '@/lib/i18n/context'

interface Notif {
  id: string
  message: string
  type: string
  carId: string | null
  read: boolean
  createdAt: string
}

export function NotificationBell() {
  const {
    totalCount, outbidCarIds, carsWithNewBids, unreadMessages,
    markAllOutbidRead, markAllCarsWithNewBidsRead,
  } = useNotifications()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(false)
  const locale = useLocale()
  const dict = useDict()
  const tn = dict.notifications
  const tc = dict.common

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => setNotifs(d.notifications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
    markAllOutbidRead()
    markAllCarsWithNewBidsRead()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const liveItems: { label: string; href: string }[] = [
    ...(unreadMessages > 0 ? [{ label: tn.unreadMessages.replace('{count}', String(unreadMessages)), href: `/${locale}/dashboard?tab=messages` }] : []),
    ...outbidCarIds.map(carId => ({ label: tn.outbid, href: `/${locale}/cars/${carId}` })),
    ...carsWithNewBids.map(carId => ({ label: tn.newBidOnListing, href: `/${locale}/cars/${carId}` })),
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-white/10 text-white"
        aria-label="Notifikationer"
      >
        <Bell className="h-4 w-4" />
        {totalCount > 0 && (
          <span className="btn-copper absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold">{tn.title}</span>
          <Link
            href={`/${locale}/dashboard`}
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground hover:underline"
          >
            {tn.gotoDashboard}
          </Link>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {liveItems.length > 0 && (
            <div className="border-b">
              {liveItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="copper-text flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                  <span className="btn-copper h-2 w-2 rounded-full shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {tc.loading}
            </div>
          ) : notifs.length === 0 && liveItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Bell className="h-8 w-8 text-muted-foreground/25" />
              <p className="text-sm text-muted-foreground">{tn.empty}</p>
            </div>
          ) : (
            notifs.map(n => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b last:border-0 text-sm ${!n.read ? 'bg-muted/30' : ''}`}
              >
                <p className={!n.read ? 'font-medium' : 'text-muted-foreground'}>{n.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(n.createdAt).toLocaleString('da-DK', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
