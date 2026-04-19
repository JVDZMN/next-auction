import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const base = process.env.NEXT_PUBLIC_APP_URL!

  if (!code || !state) {
    return NextResponse.redirect(`${base}/mitid-verified?status=error&reason=missing`)
  }

  let userId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    userId = decoded.userId
    if (!userId) throw new Error('no userId')
  } catch {
    return NextResponse.redirect(`${base}/mitid-verified?status=error&reason=invalid_state`)
  }

  // Exchange authorization code for tokens
  const tokenRes = await fetch(`https://${process.env.CRIIPTO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${base}/api/mitid/callback`,
      client_id: process.env.CRIIPTO_CLIENT_ID!,
      client_secret: process.env.CRIIPTO_CLIENT_SECRET!,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${base}/mitid-verified?status=error&reason=token_failed`)
  }

  await prisma.user.update({
    where: { id: userId },
    data: { mitIdVerified: true },
  })

  return NextResponse.redirect(`${base}/mitid-verified?status=success`)
}
