import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { serverError } from '@/lib/api'
import { sendVerificationEmail, sendBusinessSignupNotification } from '@/lib/email'
import { locales, defaultLocale } from '@/lib/i18n'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      password,
      locale: bodyLocale,
      userType,
      cvrNumber,
      skatDisclaimerAccepted,
    } = body

    // Prefer locale sent by the client; fall back to Accept-Language header
    const raw = bodyLocale ?? request.headers.get('accept-language')?.slice(0, 2).toLowerCase() ?? ''
    const locale = locales.includes(raw as (typeof locales)[number]) ? raw : defaultLocale

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Udfyld alle påkrævede felter' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Adgangskode skal være mindst 6 tegn' }, { status: 400 })
    }

    const isBusiness = userType === 'BUSINESS'

    if (isBusiness) {
      if (!cvrNumber || !/^\d{8}$/.test(cvrNumber)) {
        return NextResponse.json({ error: 'CVR-nummer skal være præcis 8 cifre' }, { status: 400 })
      }

      const existingCvr = await prisma.user.findUnique({ where: { cvrNumber } })
      if (existingCvr) {
        return NextResponse.json({ error: 'CVR-nummeret er allerede registreret' }, { status: 400 })
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email er allerede registreret' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        userType:              isBusiness ? 'BUSINESS' : 'PRIVATE',
        cvrNumber:             isBusiness ? cvrNumber : undefined,
        skatDisclaimerAccepted: skatDisclaimerAccepted ?? false,
        isApprovedByAdmin:     !isBusiness,
      },
      select: { id: true, name: true, email: true, userType: true, createdAt: true },
    })

    // Verification email
    const token = crypto.randomBytes(32).toString('hex')
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })
    sendVerificationEmail({ to: email, token, email, locale }).catch(() => {})

    // Admin notification for business accounts
    if (isBusiness) {
      const adminEmail = process.env.ADMIN_EMAIL
      if (adminEmail) {
        sendBusinessSignupNotification({
          adminEmail,
          companyName: name,
          userEmail:   email,
          cvrNumber,
        }).catch(() => {})
      }
    }

    return NextResponse.json(
      {
        message: isBusiness
          ? 'Ansøgning modtaget. Vi vender tilbage inden for 1-2 hverdage.'
          : 'Konto oprettet. Tjek din email for at verificere din adresse.',
        user,
        requiresApproval: isBusiness,
      },
      { status: 201 }
    )
  } catch (error) {
    return serverError('Failed to create user', error)
  }
}
