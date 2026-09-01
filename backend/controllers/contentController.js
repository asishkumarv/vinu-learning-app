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

const makeAbsolute = (url, req) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const host = req.get('host');
  let protocol = req.headers['x-forwarded-proto'] || req.protocol;
  
  // Force HTTPS in production domain to bypass Nginx proxy proto header absence
  if (host && host.includes('vinuh.in')) {
    protocol = 'https';
  }

  if (protocol.includes(',')) {
    protocol = protocol.split(',')[0].trim();
  }
  const formattedUrl = url.startsWith('/') ? url : '/' + url;
  return `${protocol}://${host}${formattedUrl}`;
};

exports.getEpisodesByChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const result = await db.query(
      'SELECT id, chapter_id, title, thumbnail_url, video_url, duration, is_free, is_recent, created_at FROM episodes WHERE chapter_id = $1 ORDER BY id',
      [chapterId]
    );
    const mapped = result.rows.map(row => ({
      ...row,
      video_url: makeAbsolute(row.video_url, req),
      thumbnail_url: makeAbsolute(row.thumbnail_url, req)
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
};

exports.getRecentReleases = async (req, res) => {
  try {
    let result = await db.query(
      'SELECT e.id, e.chapter_id, e.title, e.thumbnail_url, e.video_url, e.duration, e.is_free, e.is_recent, s.name as subject_name FROM episodes e JOIN chapters c ON e.chapter_id = c.id JOIN subjects s ON c.subject_id = s.id WHERE e.is_recent = TRUE ORDER BY e.created_at DESC LIMIT 10'
    );
    if (result.rows.length === 0) {
      result = await db.query(
        'SELECT e.id, e.chapter_id, e.title, e.thumbnail_url, e.video_url, e.duration, e.is_free, e.is_recent, s.name as subject_name FROM episodes e JOIN chapters c ON e.chapter_id = c.id JOIN subjects s ON c.subject_id = s.id ORDER BY e.created_at DESC LIMIT 10'
      );
    }
    const mapped = result.rows.map(row => ({
      ...row,
      video_url: makeAbsolute(row.video_url, req),
      thumbnail_url: makeAbsolute(row.thumbnail_url, req)
    }));
    res.json(mapped);
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

    // If video_url exists
    if (video_url) {
      if (video_url.startsWith('/uploads')) {
        // Stream local file from disk!
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '..', video_url); // e.g. /var/www/vinu/backend/uploads/compressed-xxx.mp4
        
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'Video file not found on disk' });
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunksize = (end - start) + 1;
          const file = fs.createReadStream(filePath, { start, end });
          const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': content_type || 'video/mp4',
          };
          res.writeHead(206, head);
          file.pipe(res);
        } else {
          const head = {
            'Content-Length': fileSize,
            'Content-Type': content_type || 'video/mp4',
          };
          res.writeHead(200, head);
          fs.createReadStream(filePath).pipe(res);
        }
        return;
      } else {
        // Redirect to external Cloudinary/URL
        return res.redirect(video_url);
      }
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

exports.getPrivacyPolicy = async (req, res) => {
  try {
    const result = await db.query("SELECT value FROM settings WHERE key = 'privacy_policy'");
    if (result.rows.length === 0) {
      return res.json({ privacy_policy: '' });
    }
    res.json({ privacy_policy: result.rows[0].value });
  } catch (error) {
    console.error('Error fetching privacy policy:', error);
    res.status(500).json({ error: 'Failed to fetch privacy policy' });
  }
};

exports.getDisclaimer = async (req, res) => {
  try {
    const result = await db.query("SELECT value FROM settings WHERE key = 'disclaimer'");
    if (result.rows.length === 0) {
      return res.json({ disclaimer: '' });
    }
    res.json({ disclaimer: result.rows[0].value });
  } catch (error) {
    console.error('Error fetching disclaimer:', error);
    res.status(500).json({ error: 'Failed to fetch disclaimer' });
  }
};

exports.getWebsiteConfig = async (req, res) => {
  try {
    const result = await db.query("SELECT value FROM settings WHERE key = 'website_config'");
    const defaultConfig = {
      heroTagline: "Listen & Learn — Smart Micro-Learning for AP & Telangana Students",
      heroSubtitle: "Transform your school and intermediate syllabus into engaging, bite-sized audio & video lessons. Tailored for Andhra Pradesh & Telangana State Boards, plus foundational life skills.",
      appDownloadUrl: "https://vinuh.in/download",
      playStoreUrl: "https://play.google.com/store/apps/details?id=com.vinuh.learning",
      supportEmail: "contact@vinuh.in",
      supportPhone: "+91 98765 43210",
      announcement: "🚀 New 10th Class Telugu & Intermediate Lessons Now Live on Vinuh App!"
    };

    if (result.rows.length === 0) {
      return res.json(defaultConfig);
    }
    try {
      const parsed = JSON.parse(result.rows[0].value);
      res.json({ ...defaultConfig, ...parsed });
    } catch {
      res.json(defaultConfig);
    }
  } catch (error) {
    console.error('Error fetching website config:', error);
    res.status(500).json({ error: 'Failed to fetch website config' });
  }
};


