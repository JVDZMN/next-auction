require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function updateCarFields() {
  const client = await pool.connect()
  
  try {
    console.log('Updating Car table...')
    
    // Add brand and model columns
    await client.query(`
      ALTER TABLE "Car" 
      ADD COLUMN IF NOT EXISTS "brand" TEXT,
      ADD COLUMN IF NOT EXISTS "model" TEXT;
    `)
    
    console.log('Added brand and model columns')
    
    // Migrate existing title data (if any exists)
    await client.query(`
      UPDATE "Car" 
      SET "brand" = split_part("title", ' ', 1),
          "model" = CASE 
            WHEN array_length(string_to_array("title", ' '), 1) > 1 
            THEN substring("title" from position(' ' in "title") + 1)
            ELSE "title"
          END
      WHERE "title" IS NOT NULL;
    `)
    
    console.log('Migrated existing title data')
    
    // Make brand and model NOT NULL
    await client.query(`
      ALTER TABLE "Car" 
      ALTER COLUMN "brand" SET NOT NULL,
      ALTER COLUMN "model" SET NOT NULL;
    `)
    
    console.log('Set brand and model as required fields')
    
    // Drop the title column
    await client.query(`
      ALTER TABLE "Car" 
      DROP COLUMN IF EXISTS "title";
    `)
    
    console.log('Removed title column')
    console.log('✅ Car table updated successfully!')
    
  } catch (error) {
    console.error('Error updating Car table:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

updateCarFields()
