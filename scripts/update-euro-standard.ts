import { Pool } from 'pg'

const pool = new Pool({ 
  connectionString: "postgresql://postgres:postgres@localhost:5434/next_auction_db"
})

async function main() {
  const client = await pool.connect()
  
  try {
    console.log('Creating EuroStandard enum type...')
    
    // Drop the column first if it exists
    await client.query(`
      ALTER TABLE "Car" DROP COLUMN IF EXISTS "euroStandard";
    `)
    
    // Create the enum type
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "EuroStandard" AS ENUM ('euro1', 'euro2', 'euro3', 'euro4', 'euro5', 'euro6');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)
    
    // Add the column with the enum type
    await client.query(`
      ALTER TABLE "Car" 
      ADD COLUMN "euroStandard" "EuroStandard";
    `)
    
    console.log('✓ EuroStandard enum created successfully!')
    console.log('\nAvailable values:')
    console.log('  - euro1')
    console.log('  - euro2')
    console.log('  - euro3')
    console.log('  - euro4')
    console.log('  - euro5')
    console.log('  - euro6')
    console.log('  - NULL (not specified)')
    
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
