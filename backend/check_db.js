const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const check = async () => {
  try {
    const res = await pool.query('SELECT id, title, video_url FROM episodes LIMIT 5');
    console.log('Database Sample Content:');
    res.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Title: "${row.title}", URL: "${row.video_url}"`);
    });
  } catch (error) {
    console.error('Check error:', error);
  } finally {
    await pool.end();
  }
};

check();
