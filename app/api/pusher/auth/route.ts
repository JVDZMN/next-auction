import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher'

export async function POST(request: NextRequest) {
  const session = await requireAuth().catch(() => null)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.text()
  const params = new URLSearchParams(body)
  const socketId    = params.get('socket_id')
  const channelName = params.get('channel_name')

  if (!socketId || !channelName) {
    return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 })
  }

  // private-user-{userId}: only that user may subscribe
  if (channelName.startsWith('private-user-')) {
    const channelUserId = channelName.slice('private-user-'.length)
    if (session.user.id !== channelUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // private-car-{carId}: any authenticated user may subscribe
  const auth = pusherServer.authorizeChannel(socketId, channelName)
  return NextResponse.json(auth)
}
