'use client'

import { useEffect, useRef } from 'react'
import { getPusherClient } from './pusher-client'

export function useSocket<T = unknown>(carId: string, onMessage: (msg: T) => void) {
  const cbRef = useRef(onMessage)
  cbRef.current = onMessage

  useEffect(() => {
    if (!carId) return
    const pusher  = getPusherClient()
    const channel = pusher.subscribe(`car-${carId}`)
    const handler = (data: T) => cbRef.current(data)
    channel.bind('new-message', handler)
    return () => {
      channel.unbind('new-message', handler)
      pusher.unsubscribe(`car-${carId}`)
    }
  }, [carId])

  // Components no longer emit via this hook — sending goes through the REST API
  return null
}
