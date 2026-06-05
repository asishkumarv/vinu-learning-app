require('dotenv').config();
const db = require('./db');

async function runMigration() {
  try {
    console.log('Starting admin migration...');

    // Add is_admin to users
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    `);
    console.log('Added is_admin to users.');

    // Add is_free to episodes
    await db.query(`
      ALTER TABLE episodes 
      ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT TRUE;
    `);
    console.log('Added is_free to episodes.');

    // We can also set a specific user as admin if needed. For now, let's just make the first user an admin for testing.
    const firstUser = await db.query('SELECT id, mobile FROM users LIMIT 1');
    if (firstUser.rows.length > 0) {
      await db.query('UPDATE users SET is_admin = TRUE WHERE id = $1', [firstUser.rows[0].id]);
      console.log(`Set user ${firstUser.rows[0].mobile} as admin.`);
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();
