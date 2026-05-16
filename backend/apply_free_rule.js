const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const applyFreeRule = async () => {
  try {
    console.log('Applying 30% free rule to all chapters...');
    
    // 1. Get all chapters
    const chapters = await pool.query('SELECT id FROM chapters');
    
    for (const chapter of chapters.rows) {
      // 2. Get episodes for this chapter ordered by ID
      const episodes = await pool.query(
        'SELECT id FROM episodes WHERE chapter_id = $1 ORDER BY id',
        [chapter.id]
      );
      
      const total = episodes.rows.length;
      const freeCount = Math.ceil(total * 0.3);
      
      console.log(`Chapter ${chapter.id}: ${total} videos, marking ${freeCount} as free.`);
      
      for (let i = 0; i < total; i++) {
        const isFree = i < freeCount;
        await pool.query(
          'UPDATE episodes SET is_free = $1 WHERE id = $2',
          [isFree, episodes.rows[i].id]
        );
      }
    }
    
    console.log('Rule applied successfully!');
  } catch (error) {
    console.error('Error applying rule:', error);
  } finally {
    await pool.end();
  }
};

applyFreeRule();
