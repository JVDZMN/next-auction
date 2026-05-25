import { pusherServer } from './pusher'

export function emitToUser(userId: string, event: string, data: unknown) {
  pusherServer.trigger(`user-${userId}`, event, data).catch(() => {})
}

export function emitToCar(carId: string, event: string, data: unknown) {
  pusherServer.trigger(`car-${carId}`, event, data).catch(() => {})
}
