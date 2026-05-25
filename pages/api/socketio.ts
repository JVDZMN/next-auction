import type { NextApiRequest, NextApiResponse } from 'next'

// Socket.IO removed — real-time is now handled by Pusher Channels
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(410).end()
}
