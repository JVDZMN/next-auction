import { PrismaNeonHttp } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function makePrisma() {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {})
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? makePrisma()

// Cache on globalThis so warm Vercel instances reuse the same client
globalForPrisma.prisma = prisma

// Shared Prisma select/include fragments
export const ownerSelect = {
  id: true,
  name: true,
  email: true,
} as const

export const bidderSelect = {
  id: true,
  name: true,
  email: true,
} as const

export const latestBidInclude = {
  orderBy: { createdAt: 'desc' as const },
  take: 1,
  include: { bidder: { select: { name: true } } },
} as const