const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5434/next_auction_db'
});

async function promoteToAdmin(email) {
  const client = await pool.connect();
  try {
    console.log(`Promoting user ${email} to Admin...`);
    
    const result = await client.query(
      `UPDATE "User" SET role = 'Admin' WHERE email = $1 RETURNING id, email, role`,
      [email]
    );
    
    if (result.rows.length === 0) {
      console.error(`User with email ${email} not found`);
      return;
    }
    
    console.log('✓ User promoted successfully:');
    console.log(result.rows[0]);
    
  } catch (error) {
    console.error('Error promoting user:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/promote-admin.js <email>');
  console.error('Example: node scripts/promote-admin.js user@example.com');
  process.exit(1);
}

promoteToAdmin(email)
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
