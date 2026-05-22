'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useNotificationSocket } from '@/lib/useNotificationSocket'

type NotifCtx = {
  unreadMessages: number
  carsWithNewBids: string[]   // owner view: carIds with unread new_bid notifications
  outbidCarIds: string[]      // bidder view: carIds where current user has been outbid
  totalCount: number
  refresh: () => void
  markMessagesRead: () => Promise<void>
  markCarBidsRead: (carId: string) => Promise<void>
  markOutbidRead: (carId: string) => Promise<void>
}

const NotifContext = createContext<NotifCtx>({
  unreadMessages: 0,
  carsWithNewBids: [],
  outbidCarIds: [],
  totalCount: 0,
  refresh: () => {},
  markMessagesRead: async () => {},
  markCarBidsRead: async () => {},
  markOutbidRead: async () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [carsWithNewBids, setCarsWithNewBids] = useState<string[]>([])
  const [outbidCarIds, setOutbidCarIds] = useState<string[]>([])

  const refresh = useCallback(() => {
    if (!session?.user) return
    fetch('/api/messages/notifications')
      .then(r => r.json())
      .then(d => {
        setUnreadMessages(d.unreadMessages ?? 0)
        setCarsWithNewBids(d.carsWithNewBids ?? [])
        setOutbidCarIds(d.outbidCarIds ?? [])
      })
      .catch(() => {})
  }, [session?.user])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (session?.user) refresh() }, [session?.user?.id])

  const handleNew = useCallback((notif: { type: string; carId?: string | null }) => {
    if (notif.type === 'new_message') {
      setUnreadMessages(c => c + 1)
    } else if (notif.type === 'new_bid' && notif.carId) {
      const carId = notif.carId
      setCarsWithNewBids(prev => prev.includes(carId) ? prev : [...prev, carId])
    } else if (notif.type === 'outbid' && notif.carId) {
      const carId = notif.carId
      setOutbidCarIds(prev => prev.includes(carId) ? prev : [...prev, carId])
    }
  }, [])

  useNotificationSocket(session?.user?.id ?? '', handleNew)

  const markMessagesRead = useCallback(async () => {
    await fetch('/api/messages/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: 'messages' }),
    }).catch(() => {})
    setUnreadMessages(0)
  }, [])

  const markCarBidsRead = useCallback(async (carId: string) => {
    await fetch('/api/messages/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: 'bids', carId }),
    }).catch(() => {})
    setCarsWithNewBids(prev => prev.filter(id => id !== carId))
  }, [])

  const markOutbidRead = useCallback(async (carId: string) => {
    await fetch('/api/messages/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: 'outbid', carId }),
    }).catch(() => {})
    setOutbidCarIds(prev => prev.filter(id => id !== carId))
  }, [])

  const totalCount = unreadMessages + carsWithNewBids.length + outbidCarIds.length

  return (
    <NotifContext.Provider value={{
      unreadMessages, carsWithNewBids, outbidCarIds, totalCount,
      refresh, markMessagesRead, markCarBidsRead, markOutbidRead,
    }}>
      {children}
    </NotifContext.Provider>
  )
}

export const useNotifications = () => useContext(NotifContext)
