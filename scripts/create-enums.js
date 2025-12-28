const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function createEnums() {
  const client = await pool.connect()

  try {
    console.log('Creating FuelType enum...')

    // Check if FuelType enum exists
    const checkFuelType = await client.query(`
      SELECT typname FROM pg_type WHERE typname = 'FuelType'
    `)

    if (checkFuelType.rows.length === 0) {
      await client.query(`
        CREATE TYPE "FuelType" AS ENUM ('Benzin', 'Diesel', 'Hybrid', 'PluginHybrid', 'Electric')
      `)
      console.log('✓ Created FuelType enum')
    } else {
      console.log('✓ FuelType enum already exists')
    }

    // Check if EuroStandard enum exists
    const checkEuroStandard = await client.query(`
      SELECT typname FROM pg_type WHERE typname = 'EuroStandard'
    `)

    if (checkEuroStandard.rows.length === 0) {
      await client.query(`
        CREATE TYPE "EuroStandard" AS ENUM ('euro1', 'euro2', 'euro3', 'euro4', 'euro5', 'euro6')
      `)
      console.log('✓ Created EuroStandard enum')
    } else {
      console.log('✓ EuroStandard enum already exists')
    }

    // Update Car table to use enums
    console.log('\nUpdating Car table columns...')

    // Check current fuel column type
    const checkFuelColumn = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Car' AND column_name = 'fuel'
    `)

    if (checkFuelColumn.rows.length > 0 && checkFuelColumn.rows[0].data_type !== 'USER-DEFINED') {
      // Drop default first
      await client.query(`ALTER TABLE "Car" ALTER COLUMN "fuel" DROP DEFAULT`)
      
      await client.query(`
        ALTER TABLE "Car" 
        ALTER COLUMN "fuel" TYPE "FuelType" USING "fuel"::"FuelType"
      `)
      console.log('✓ Updated fuel column to FuelType enum')
    } else {
      console.log('✓ fuel column already using FuelType')
    }

    // Check current euroStandard column type
    const checkEuroColumn = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Car' AND column_name = 'euroStandard'
    `)

    if (checkEuroColumn.rows.length > 0 && checkEuroColumn.rows[0].data_type !== 'USER-DEFINED') {
      // Drop default first if exists
      await client.query(`ALTER TABLE "Car" ALTER COLUMN "euroStandard" DROP DEFAULT`)
      
      await client.query(`
        ALTER TABLE "Car" 
        ALTER COLUMN "euroStandard" TYPE "EuroStandard" USING "euroStandard"::"EuroStandard"
      `)
      console.log('✓ Updated euroStandard column to EuroStandard enum')
    } else {
      console.log('✓ euroStandard column already using EuroStandard')
    }

    console.log('\n✅ Enums created and applied successfully!')
  } catch (error) {
    console.error('❌ Error creating enums:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

createEnums()
