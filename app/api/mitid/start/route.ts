import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import crypto from 'crypto'

export async function GET() {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/signin`)
  }

  if (!process.env.CRIIPTO_CLIENT_ID || !process.env.CRIIPTO_DOMAIN) {
    return NextResponse.json({ error: 'MitID not configured' }, { status: 503 })
  }

  // Encode userId in state so the callback knows which user to update
  const state = Buffer.from(
    JSON.stringify({ userId: session.user.id, nonce: crypto.randomBytes(12).toString('hex') })
  ).toString('base64url')

  const params = new URLSearchParams({
    client_id: process.env.CRIIPTO_CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/mitid/callback`,
    response_type: 'code',
    scope: 'openid',
    acr_values: 'urn:grn:authn:dk:mitid:substantial',
    state,
  })

  const authUrl = `https://${process.env.CRIIPTO_DOMAIN}/oauth2/authorize?${params}`
  return NextResponse.redirect(authUrl)
}
