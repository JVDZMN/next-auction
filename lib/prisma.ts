import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

const pool = globalForPrisma.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,                        // one connection per serverless function instance
  connectionTimeoutMillis: 10_000, // wait up to 10 s for Neon to wake from sleep
  idleTimeoutMillis: 10_000,
})

const adapter = new PrismaPg(pool)
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

// Always cache — on Vercel, globalThis persists across warm invocations in the same instance
globalForPrisma.prisma = prisma
globalForPrisma.pool = pool

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