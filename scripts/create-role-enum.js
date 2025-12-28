const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5434/next_auction_db'
});

async function createRoleEnum() {
  const client = await pool.connect();
  try {
    console.log('Creating Role enum...');
    
    // Create the enum type
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('User', 'Admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    console.log('✓ Role enum created successfully');
    
  } catch (error) {
    console.error('Error creating Role enum:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createRoleEnum()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
