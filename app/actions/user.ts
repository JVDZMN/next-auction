'use server'

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function acceptSkatDisclaimer() {
  const session = await requireAuth()
  if (!session) return { error: 'Unauthorized' }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        skatDisclaimerAccepted: true,
        acceptedAt: new Date(),
      }
    })
    revalidatePath('/[locale]/cars/create', 'page')
    return { success: true }
  } catch (error) {
    console.error('Failed to accept SKAT disclaimer:', error)
    return { error: 'Der opstod en fejl. Prøv venligst igen.' }
  }
}