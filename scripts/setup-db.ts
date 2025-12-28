import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const pool = new Pool({ 
  connectionString: "postgresql://postgres:postgres@localhost:5434/next_auction_db"
})

// Create tables directly using SQL
async function main() {
  const client = await pool.connect()
  
  try {
    console.log('Creating database tables...')
    
    // Run the SQL to create all tables
    await client.query(`
      -- User table
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT,
        "email" TEXT UNIQUE NOT NULL,
        "emailVerified" TIMESTAMP,
        "image" TEXT,
        "password" TEXT,
        "googleId" TEXT UNIQUE,
        "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "ratingCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Account table (NextAuth)
      CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        "refresh_token" TEXT,
        "access_token" TEXT,
        "expires_at" INTEGER,
        "token_type" TEXT,
        "scope" TEXT,
        "id_token" TEXT,
        "session_state" TEXT,
        CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE ("provider", "providerAccountId")
      );

      -- Session table (NextAuth)
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT PRIMARY KEY,
        "sessionToken" TEXT UNIQUE NOT NULL,
        "userId" TEXT NOT NULL,
        "expires" TIMESTAMP NOT NULL,
        CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      -- VerificationToken table (NextAuth)
      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        "identifier" TEXT NOT NULL,
        "token" TEXT UNIQUE NOT NULL,
        "expires" TIMESTAMP NOT NULL,
        CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE ("identifier", "token")
      );

      -- Car table
      CREATE TABLE IF NOT EXISTS "Car" (
        "id" TEXT PRIMARY KEY,
        "ownerId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "specs" TEXT,
        "condition" TEXT NOT NULL,
        "images" TEXT[] NOT NULL DEFAULT '{}',
        "startingPrice" DOUBLE PRECISION NOT NULL,
        "currentPrice" DOUBLE PRECISION NOT NULL,
        "reservePrice" DOUBLE PRECISION,
        "auctionEndDate" TIMESTAMP NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'active',
        "winnerBidId" TEXT UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Car_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      -- Bid table
      CREATE TABLE IF NOT EXISTS "Bid" (
        "id" TEXT PRIMARY KEY,
        "carId" TEXT NOT NULL,
        "bidderId" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Bid_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE,
        CONSTRAINT "Bid_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      -- Add winnerBidId foreign key to Car
      ALTER TABLE "Car" DROP CONSTRAINT IF EXISTS "Car_winnerBidId_fkey";
      ALTER TABLE "Car" ADD CONSTRAINT "Car_winnerBidId_fkey" 
        FOREIGN KEY ("winnerBidId") REFERENCES "Bid"("id");

      -- Notification table
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "carId" TEXT,
        "read" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      -- Rating table
      CREATE TABLE IF NOT EXISTS "Rating" (
        "id" TEXT PRIMARY KEY,
        "ratedUserId" TEXT NOT NULL,
        "raterUserId" TEXT NOT NULL,
        "carId" TEXT,
        "score" INTEGER NOT NULL,
        "comment" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Rating_ratedUserId_fkey" FOREIGN KEY ("ratedUserId") REFERENCES "User"("id") ON DELETE CASCADE,
        CONSTRAINT "Rating_raterUserId_fkey" FOREIGN KEY ("raterUserId") REFERENCES "User"("id") ON DELETE CASCADE,
        CONSTRAINT "Rating_ratedUserId_raterUserId_carId_key" UNIQUE ("ratedUserId", "raterUserId", "carId")
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS "Car_ownerId_idx" ON "Car"("ownerId");
      CREATE INDEX IF NOT EXISTS "Car_status_idx" ON "Car"("status");
      CREATE INDEX IF NOT EXISTS "Car_auctionEndDate_idx" ON "Car"("auctionEndDate");
      CREATE INDEX IF NOT EXISTS "Bid_carId_idx" ON "Bid"("carId");
      CREATE INDEX IF NOT EXISTS "Bid_bidderId_idx" ON "Bid"("bidderId");
      CREATE INDEX IF NOT EXISTS "Bid_createdAt_idx" ON "Bid"("createdAt");
      CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
      CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read");
      CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
      CREATE INDEX IF NOT EXISTS "Rating_ratedUserId_idx" ON "Rating"("ratedUserId");
    `)
    
    console.log('✓ All tables created successfully!')
    
    // Verify tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('\nCreated tables:')
    result.rows.forEach(row => console.log(`  - ${row.table_name}`))
    
  } catch (error) {
    console.error('Error creating tables:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
