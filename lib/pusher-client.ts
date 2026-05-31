import PusherJs from 'pusher-js'
import { env } from './env'

let client: PusherJs | null = null

export function getPusherClient(): PusherJs {
  if (!client) {
    client = new PusherJs(env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })
  }
  return client
}
