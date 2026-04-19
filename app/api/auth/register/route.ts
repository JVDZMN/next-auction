import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, createdAt: true },
    })

    // Generate verification token valid for 24 hours
    const token = crypto.randomBytes(32).toString('hex')
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    // Fire-and-forget — don't block the response on email delivery
    sendVerificationEmail({ to: email, token, email }).catch(() => {})

    return NextResponse.json(
      { message: 'Account created. Please check your email to verify your address.', user },
      { status: 201 }
    )
  } catch (error) {
    return serverError('Failed to create user', error)
  }
}
