import { pusherServer } from './pusher'

export function emitToUser(userId: string, event: string, data: unknown) {
  pusherServer.trigger(`user-${userId}`, event, data).catch((err) => {
    console.error('[Pusher] emitToUser failed', { userId, event, err })
  })
}

export function emitToCar(carId: string, event: string, data: unknown) {
  pusherServer.trigger(`car-${carId}`, event, data).catch((err) => {
    console.error('[Pusher] emitToCar failed', { carId, event, err })
  })
}
