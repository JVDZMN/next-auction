import { Pool } from 'pg'

const pool = new Pool({ 
  connectionString: "postgresql://postgres:postgres@localhost:5434/next_auction_db"
})

async function main() {
  const client = await pool.connect()
  
  try {
    console.log('Adding new columns to Car table...')
    
    await client.query(`
      ALTER TABLE "Car" 
      ADD COLUMN IF NOT EXISTS "km" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "year" INTEGER NOT NULL DEFAULT 2020,
      ADD COLUMN IF NOT EXISTS "power" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "fuel" TEXT NOT NULL DEFAULT 'benzin',
      ADD COLUMN IF NOT EXISTS "euroStandard" TEXT;
    `)
    
    console.log('✓ New columns added successfully!')
    console.log('\nAdded fields:')
    console.log('  - km: Kilometers driven')
    console.log('  - year: Model year')
    console.log('  - power: Engine power (HP or kW)')
    console.log('  - fuel: Fuel type (benzin, diesel, el)')
    console.log('  - euroStandard: Euro emission standard (optional)')
    
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
