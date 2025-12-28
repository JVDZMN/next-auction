import { Pool } from 'pg'

const pool = new Pool({ 
  connectionString: "postgresql://postgres:postgres@localhost:5434/next_auction_db"
})

async function main() {
  const client = await pool.connect()
  
  try {
    console.log('Adding role column to User table...')
    
    await client.query(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';
    `)
    
    console.log('✓ Role column added successfully!')
    console.log('\nAvailable roles:')
    console.log('  - user (default): Regular users who can bid and sell')
    console.log('  - admin: Administrators with full access')
    
  } catch (error) {
    console.error('Error:', error)
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
