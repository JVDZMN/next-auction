import { pusherServer } from './pusher'

export function emitToUser(userId: string, event: string, data: unknown) {
  pusherServer.trigger(`user-${userId}`, event, data).catch((err) => {
    console.error('[Pusher] emitToUser failed', { userId, event, err })
  })
}

export async function emitToCar(carId: string, event: string, data: unknown): Promise<void> {
  await pusherServer.trigger(`car-${carId}`, event, data).catch((err) => {
    console.error('[Pusher] emitToCar failed', { carId, event, err })
  })
}
