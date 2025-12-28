import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function updateCarTable() {
  const client = await pool.connect()

  try {
    console.log('Updating Car table structure...')

    // Check if title column exists
    const checkTitle = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Car' AND column_name = 'title'
    `)

    if (checkTitle.rows.length > 0) {
      // Check if brand and model already exist
      const checkBrand = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Car' AND column_name = 'brand'
      `)

      if (checkBrand.rows.length === 0) {
        // Add brand and model columns
        await client.query(`
          ALTER TABLE "Car" 
          ADD COLUMN "brand" TEXT,
          ADD COLUMN "model" TEXT
        `)
        console.log('✓ Added brand and model columns')

        // Copy data from title to brand (you may need to split manually)
        await client.query(`
          UPDATE "Car" 
          SET "brand" = SPLIT_PART("title", ' ', 1),
              "model" = SUBSTRING("title" FROM POSITION(' ' IN "title") + 1)
          WHERE "title" IS NOT NULL
        `)
        console.log('✓ Migrated title data to brand/model')

        // Make columns NOT NULL
        await client.query(`
          ALTER TABLE "Car" 
          ALTER COLUMN "brand" SET NOT NULL,
          ALTER COLUMN "model" SET NOT NULL
        `)
        console.log('✓ Set brand and model as NOT NULL')

        // Drop title column
        await client.query(`ALTER TABLE "Car" DROP COLUMN "title"`)
        console.log('✓ Removed title column')
      } else {
        console.log('✓ Brand and model columns already exist')
        
        // Just drop title if brand/model exist
        await client.query(`ALTER TABLE "Car" DROP COLUMN "title"`)
        console.log('✓ Removed title column')
      }
    } else {
      console.log('✓ Title column does not exist, structure is correct')
    }

    console.log('\n✅ Car table updated successfully!')
  } catch (error) {
    console.error('❌ Error updating Car table:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

updateCarTable()
