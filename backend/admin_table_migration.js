require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');

async function runMigration() {
  try {
    console.log('Starting admins table migration...');

    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created admins table.');

    // Create default admin if not exists
    const adminExist = await db.query('SELECT * FROM admins WHERE email = $1', ['admin@vinu.com']);
    if (adminExist.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await db.query('INSERT INTO admins (email, password) VALUES ($1, $2)', ['admin@vinu.com', hashedPassword]);
      console.log('Inserted default admin: admin@vinu.com / admin123');
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();
