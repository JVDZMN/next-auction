'use client'

import { useEffect, useRef } from 'react'
import { getPusherClient } from './pusher-client'

export function useUserChatSocket<T = unknown>(
  userId: string,
  _peerId: string,
  onMessage: (msg: T) => void,
) {
  const cbRef = useRef(onMessage)
  cbRef.current = onMessage

  useEffect(() => {
    if (!userId) return
    const pusher  = getPusherClient()
    const channel = pusher.subscribe(`user-${userId}`)
    const handler = (data: T) => cbRef.current(data)
    channel.bind('new-message', handler)
    return () => {
      channel.unbind('new-message', handler)
      pusher.unsubscribe(`user-${userId}`)
    }
  }, [userId])

  return null
}
