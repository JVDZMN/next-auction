import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const fail = (reason: string) =>
    NextResponse.redirect(`${base}/auth/verify-email?status=error&reason=${reason}`)

  if (!token || !email) return fail('missing')

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!record || record.identifier !== email) return fail('invalid')
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } })
    return fail('expired')
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ])

  return NextResponse.redirect(`${base}/auth/verify-email?status=success`)
}
