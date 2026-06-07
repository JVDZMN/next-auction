'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { getPusherClient } from './pusher-client'

type Notification = {
  id: string
  message: string
  type: string
  carId?: string | null
  createdAt: string
}

export function useNotificationSocket(
  userId: string,
  onNotification: (n: Notification) => void,
) {
  const cbRef = useRef(onNotification)
  useLayoutEffect(() => { cbRef.current = onNotification })

  useEffect(() => {
    if (!userId) return
    const pusher  = getPusherClient()
    const channel = pusher.subscribe(`private-user-${userId}`)
    const handler = (data: Notification) => cbRef.current(data)
    channel.bind('new-notification', handler)
    return () => {
      channel.unbind('new-notification', handler)
    }
  }, [userId])
}
