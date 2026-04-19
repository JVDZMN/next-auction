import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

const pool = globalForPrisma.pool ?? new Pool({ 
  connectionString: process.env.DATABASE_URL 
})
const adapter = new PrismaPg(pool)


export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.pool = pool
}

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