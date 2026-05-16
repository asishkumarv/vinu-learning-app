const db = require('../db');

exports.getClasses = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM classes ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
};

exports.getSubjectsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const result = await db.query('SELECT * FROM subjects WHERE class_id = $1 ORDER BY name', [classId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};

exports.getChaptersBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const result = await db.query('SELECT * FROM chapters WHERE subject_id = $1 ORDER BY id', [subjectId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
};

exports.getEpisodesByChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const result = await db.query(
      'SELECT id, chapter_id, title, thumbnail_url, video_url, duration, is_free, is_recent, created_at FROM episodes WHERE chapter_id = $1 ORDER BY id',
      [chapterId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
};

exports.getRecentReleases = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT e.id, e.chapter_id, e.title, e.thumbnail_url, e.video_url, e.duration, e.is_free, e.is_recent, s.name as subject_name FROM episodes e JOIN chapters c ON e.chapter_id = c.id JOIN subjects s ON c.subject_id = s.id WHERE e.is_recent = TRUE ORDER BY e.created_at DESC LIMIT 10'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent releases' });
  }
};

exports.streamVideo = async (req, res) => {
  try {
    const { episodeId } = req.params;
    
    // 1. Get video metadata and size first (very fast)
    const metaResult = await db.query(
      'SELECT octet_length(video_data) as size, content_type, video_url FROM episodes WHERE id = $1', 
      [episodeId]
    );
    
    if (metaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const { size: videoSize, content_type, video_url } = metaResult.rows[0];

    // If Cloudinary URL exists, redirect to it
    if (video_url) {
        return res.redirect(video_url);
    }

    if (!videoSize) {
        return res.status(404).json({ error: 'Video content not available' });
    }
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;

      if (start >= videoSize) {
        res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + videoSize);
        return;
      }

      const chunksize = (end - start) + 1;
      
      // 2. Fetch ONLY the requested chunk from the database (saves RAM and time)
      // PostgreSQL substring for bytea is 1-indexed
      const chunkResult = await db.query(
        'SELECT substring(video_data from $1 for $2) as data FROM episodes WHERE id = $3',
        [start + 1, chunksize, episodeId]
      );

      const head = {
        'Content-Range': `bytes ${start}-${end}/${videoSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': content_type || 'video/mp4',
      };

      res.writeHead(206, head);
      res.end(chunkResult.rows[0].data);
    } else {
      // If no range, we still fetch the whole thing, but typically players always send ranges
      const result = await db.query('SELECT video_data FROM episodes WHERE id = $1', [episodeId]);
      const head = {
        'Content-Length': videoSize,
        'Content-Type': content_type || 'video/mp4',
      };
      res.writeHead(200, head);
      res.end(result.rows[0].video_data);
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
};
