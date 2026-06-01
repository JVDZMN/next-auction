'use server'

import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function approveBusinessUser(userId: string) {
  const session = await requireAdmin()
  if (!session) return { error: 'Unauthorized' }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isApprovedByAdmin: true }
    })
    revalidatePath('/[locale]/admin/users', 'page')
    return { success: true }
  } catch (error) {
    console.error('Failed to approve user:', error)
    return { error: 'Failed to approve business account' }
  }
}