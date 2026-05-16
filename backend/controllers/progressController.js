const db = require('../db');

exports.updateProgress = async (req, res) => {
  try {
    const { episode_id, status } = req.body;
    const userId = req.user.id; // From auth middleware

    const result = await db.query(
      `INSERT INTO user_progress (user_id, episode_id, status, last_watched_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, episode_id)
       DO UPDATE SET status = EXCLUDED.status, last_watched_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, episode_id, status]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
};

exports.getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT p.*, e.title, e.thumbnail_url 
       FROM user_progress p 
       JOIN episodes e ON p.episode_id = e.id 
       WHERE p.user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
};
