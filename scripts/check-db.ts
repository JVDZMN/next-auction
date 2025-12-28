import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const pool = new Pool({ 
  connectionString: "postgresql://postgres:postgres@localhost:5434/next_auction_db"
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('Testing database connection...')
  
  // Test connection
  await prisma.$connect()
  console.log('✓ Connected to database')
  
  // Check if tables exist
  const result = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `
  
  console.log('Existing tables:', result)
  
  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
