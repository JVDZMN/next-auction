/**
 * Integration test database helpers.
 *
 * Usage:
 *   import { db, resetDb } from '@/lib/test/db'
 *   beforeEach(resetDb)
 *   afterAll(() => db.$disconnect())
 *
 * Requires TEST_DATABASE_URL in the environment (separate from DATABASE_URL).
 * Run `prisma migrate deploy` against it once before the suite — the
 * test:integration npm script handles this via the shell command below.
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { execSync } from 'child_process'

if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Integration tests require a dedicated test database.\n' +
    'Example: TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/next_auction_test',
  )
}

// Mirror lib/prisma.ts exactly, but point the pool at the test database.
// PrismaClient({ adapter }) is required because this project uses @prisma/adapter-pg;
// the no-argument constructor fails when a driver adapter is configured.
const testPool = new Pool({ connectionString: process.env.TEST_DATABASE_URL })
const testAdapter = new PrismaPg(testPool)
export const db = new PrismaClient({ adapter: testAdapter })

// Run migrations once per process — idempotent
let migrated = false
export function ensureMigrated() {
  if (migrated) return
  // prisma.config.ts reads env("DATABASE_URL") — override it to point at the test DB.
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL! },
    stdio: 'pipe',
  })
  migrated = true
}

export async function disconnectDb() {
  await db.$disconnect()
  await testPool.end()
}

// Truncate all application tables in dependency order (FK-safe)
export async function resetDb() {
  await db.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Notification",
      "Message",
      "ProxyBid",
      "SavedSearch",
      "Like",
      "Bid",
      "Car",
      "VerificationToken",
      "Session",
      "Account",
      "User"
    RESTART IDENTITY CASCADE
  `)
}

// ---------------------------------------------------------------------------
// Seed helpers — create the minimum data needed for bid tests
// ---------------------------------------------------------------------------

export async function seedUser(overrides?: { id?: string; email?: string; name?: string }) {
  return db.user.create({
    data: {
      id: overrides?.id ?? `user-${Math.random().toString(36).slice(2)}`,
      email: overrides?.email ?? `test-${Date.now()}@example.com`,
      name: overrides?.name ?? 'Test User',
    },
  })
}

export async function seedCar(ownerId: string, overrides?: {
  currentPrice?: number
  startingPrice?: number
  auctionEndDate?: Date
  status?: string
}) {
  const now = new Date()
  return db.car.create({
    data: {
      ownerId,
      brand: 'BMW',
      model: 'M3',
      description: 'Test car',
      condition: 'excellent',
      km: 50_000,
      year: 2020,
      power: 450,
      startingPrice: overrides?.startingPrice ?? 100_000,
      currentPrice: overrides?.currentPrice ?? 100_000,
      auctionEndDate: overrides?.auctionEndDate ?? new Date(now.getTime() + 3_600_000),
      status: (overrides?.status ?? 'active') as never,
    },
  })
}
