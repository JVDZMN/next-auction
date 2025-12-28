const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5434/next_auction_db'
});

async function migrateRoleColumn() {
  const client = await pool.connect();
  try {
    console.log('Converting role column from text to Role enum...');
    
    // First, update any existing role values to match enum values
    await client.query(`
      UPDATE "User" 
      SET role = 'User' 
      WHERE role IS NULL OR role NOT IN ('User', 'Admin')
    `);
    
    console.log('✓ Normalized existing role values');
    
    // Drop the default constraint first
    await client.query(`
      ALTER TABLE "User" 
      ALTER COLUMN role DROP DEFAULT
    `);
    
    console.log('✓ Dropped default constraint');
    
    // Convert the column type to the Role enum
    await client.query(`
      ALTER TABLE "User" 
      ALTER COLUMN role TYPE "Role" 
      USING role::"Role"
    `);
    
    console.log('✓ Converted role column to Role enum type');
    
    // Set the default value using enum
    await client.query(`
      ALTER TABLE "User" 
      ALTER COLUMN role SET DEFAULT 'User'::"Role"
    `);
    
    console.log('✓ Set default value for role column');
    
  } catch (error) {
    console.error('Error migrating role column:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateRoleColumn()
  .then(() => {
    console.log('Done! Role column successfully migrated to enum type.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
