'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useNotificationSocket } from '@/lib/useNotificationSocket'

type ChatUser = { id: string; name: string; image: string | null }

type NotifCtx = {
  unreadMessages: number
  carsWithNewBids: string[]
  outbidCarIds: string[]
  totalCount: number
  unreadPerSender: Record<string, number>
  msgUsers: ChatUser[]
  refresh: () => void
  markMessagesRead: () => Promise<void>
  markCarBidsRead: (carId: string) => Promise<void>
  markOutbidRead: (carId: string) => Promise<void>
  markSenderRead: (senderId: string) => void
}

const NotifContext = createContext<NotifCtx>({
  unreadMessages: 0,
  carsWithNewBids: [],
  outbidCarIds: [],
  totalCount: 0,
  unreadPerSender: {},
  msgUsers: [],
  refresh: () => {},
  markMessagesRead: async () => {},
  markCarBidsRead: async () => {},
  markOutbidRead: async () => {},
  markSenderRead: () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [carsWithNewBids, setCarsWithNewBids] = useState<string[]>([])
  const [outbidCarIds, setOutbidCarIds] = useState<string[]>([])
  const [unreadPerSender, setUnreadPerSender] = useState<Record<string, number>>({})
  const [msgUsers, setMsgUsers] = useState<ChatUser[]>([])

  const refresh = useCallback(() => {
    if (!session?.user) return
    fetch('/api/messages/notifications')
      .then(r => r.json())
      .then(d => {
        setUnreadMessages(d.unreadMessages ?? 0)
        setCarsWithNewBids(d.carsWithNewBids ?? [])
        setOutbidCarIds(d.outbidCarIds ?? [])
        setUnreadPerSender(d.unreadPerSender ?? {})
        setMsgUsers(d.users ?? [])
      })
      .catch(() => {})
  }, [session?.user])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (session?.user) refresh() }, [session?.user?.id])

  const handleNew = useCallback((notif: {
    type: string
    carId?: string | null
    senderId?: string
    senderName?: string
    senderImage?: string | null
  }) => {
    if (notif.type === 'new_message') {
      setUnreadMessages(c => c + 1)
      if (notif.senderId) {
        setUnreadPerSender(prev => ({ ...prev, [notif.senderId!]: (prev[notif.senderId!] ?? 0) + 1 }))
        // Add sender to contact list if not already there
        if (notif.senderName) {
          setMsgUsers(prev => {
            if (prev.some(u => u.id === notif.senderId)) return prev
            return [{ id: notif.senderId!, name: notif.senderName!, image: notif.senderImage ?? null }, ...prev]
          })
        }
      }
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
    setUnreadPerSender({})
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

  const markSenderRead = useCallback((senderId: string) => {
    setUnreadPerSender(prev => {
      const next = { ...prev }
      delete next[senderId]
      return next
    })
  }, [])

  const totalCount = unreadMessages + carsWithNewBids.length + outbidCarIds.length

  return (
    <NotifContext.Provider value={{
      unreadMessages, carsWithNewBids, outbidCarIds, totalCount,
      unreadPerSender, msgUsers,
      refresh, markMessagesRead, markCarBidsRead, markOutbidRead, markSenderRead,
    }}>
      {children}
    </NotifContext.Provider>
  )
}

export const useNotifications = () => useContext(NotifContext)
