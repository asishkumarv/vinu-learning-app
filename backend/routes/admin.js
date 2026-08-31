const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const adminAuth = require('../middleware/adminAuth');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobe = require('@ffprobe-installer/ffprobe');
const cloudinary = require('cloudinary').v2;

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobe.path);

const storageMode = process.env.VIDEO_STORAGE_MODE || 'local';

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim()
  });
}


// Ensure uploads dir exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Apply auth and admin check to all routes
router.use(auth);
router.use(adminAuth);

router.get('/stats', async (req, res) => {
  try {
    const usersCount = await db.query('SELECT COUNT(*) FROM users');
    const videosCount = await db.query('SELECT COUNT(*) FROM episodes');
    const recentUploads = await db.query('SELECT e.id, e.title, e.created_at, c.name as chapter_name FROM episodes e LEFT JOIN chapters c ON e.chapter_id = c.id ORDER BY e.created_at DESC LIMIT 5');
    
    res.json({
      usersCount: parseInt(usersCount.rows[0].count),
      videosCount: parseInt(videosCount.rows[0].count),
      recentUploads: recentUploads.rows
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await db.query('SELECT id, name, mobile, is_admin, created_at FROM users ORDER BY created_at DESC');
    res.json(users.rows);
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const classes = await db.query('SELECT * FROM classes');
    const subjects = await db.query('SELECT * FROM subjects');
    const chapters = await db.query('SELECT * FROM chapters');
    res.json({
      classes: classes.rows,
      subjects: subjects.rows,
      chapters: chapters.rows
    });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

const getDurationAndThumbnail = (videoPath, filename) => {
  return new Promise((resolve, reject) => {
    // 1. Get video duration
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        return reject(new Error('Failed to parse video metadata: ' + err.message));
      }
      const duration = Math.floor(metadata.format.duration || 0);
      
      // 2. Generate thumbnail
      const thumbnailName = 'thumbnail-' + filename.split('.')[0] + '.jpg';
      ffmpeg(videoPath)
        .screenshots({
          count: 1,
          timestamps: ['2'], // at 2 seconds
          folder: uploadDir,
          filename: thumbnailName,
          size: '?x480'
        })
        .on('end', () => {
          resolve({ duration, thumbnailName });
        })
        .on('error', (thumbnailErr) => {
          // If screenshot fails (e.g. video shorter than 2s), try at 0s
          ffmpeg(videoPath)
            .screenshots({
              count: 1,
              timestamps: ['0'],
              folder: uploadDir,
              filename: thumbnailName,
              size: '?x480'
            })
            .on('end', () => {
              resolve({ duration, thumbnailName });
            })
            .on('error', (err2) => {
              reject(new Error('Failed to generate thumbnail: ' + err2.message));
            });
        });
    });
  });
};

const processVideoFile = (inputPath, outputPath, fileSize) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        return reject(new Error('Failed to probe video: ' + err.message));
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const sar = videoStream ? videoStream.sample_aspect_ratio : null;
      const isAnamorphic = sar && sar !== '1:1' && sar !== '0:1';

      const fileSizeMB = fileSize / (1024 * 1024);
      const needsCompression = fileSizeMB >= 30;

      if (needsCompression || isAnamorphic) {
        console.log(`Processing video: size=${fileSizeMB.toFixed(2)}MB, isAnamorphic=${isAnamorphic}. Running ffmpeg...`);
        const proc = ffmpeg(inputPath)
          .videoCodec('libx264')
          .outputOptions(['-crf 28', '-preset veryfast', '-movflags +faststart']);

        if (isAnamorphic) {
          console.log(`Forcing square pixels with scale='trunc(iw*sar/2)*2':ih filter for anamorphic video (SAR: ${sar})`);
          proc.outputOptions('-vf', "scale='trunc(iw*sar/2)*2':ih,setsar=1");
        }

        proc.on('end', () => {
          try { fs.unlinkSync(inputPath); } catch (e) {}
          resolve();
        })
        .on('error', (ffmpegErr) => reject(ffmpegErr))
        .save(outputPath);
      } else {
        console.log(`Skipping compression: size=${fileSizeMB.toFixed(2)}MB. Moving file.`);
        try {
          fs.renameSync(inputPath, outputPath);
          resolve();
        } catch (renameErr) {
          reject(renameErr);
        }
      }
    });
  });
};

router.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const { sectionName, className, subjectName, chapterName, title, is_free } = req.body;
  const isFreeBool = is_free === 'true' || is_free === true;

  try {
    const inputPath = req.file.path;
    const outputPath = path.join(uploadDir, 'compressed-' + req.file.filename);

    await processVideoFile(inputPath, outputPath, req.file.size);

    let videoUrl = null;
    let videoData = null;
    let duration = 0;
    let thumbnailUrl = null;
    let contentType = req.file.mimetype || 'video/mp4';

    console.log('Generating thumbnail and duration...');
    const metadata = await getDurationAndThumbnail(outputPath, req.file.filename);
    duration = metadata.duration;
    thumbnailUrl = `/uploads/${metadata.thumbnailName}`;

    // Make thumbnail readable by Nginx
    try {
      fs.chmodSync(path.join(uploadDir, metadata.thumbnailName), 0o644);
    } catch (e) {
      console.error('Failed to set permissions on thumbnail:', e.message);
    }

    if (storageMode === 'database') {
      console.log('Reading video into database buffer...');
      videoData = fs.readFileSync(outputPath);
      // Clean up compressed video from disk
      fs.unlinkSync(outputPath);
    } else {
      // Local storage
      videoUrl = `/uploads/compressed-${req.file.filename}`;
      // Make video readable by Nginx
      try {
        fs.chmodSync(outputPath, 0o644);
      } catch (e) {
        console.error('Failed to set permissions on video:', e.message);
      }
    }

    // Get DB objects, create if not exist
    await db.query('BEGIN');

    let classRow = await db.query('SELECT id FROM classes WHERE name = $1 AND section = $2', [className, sectionName]);
    if (classRow.rows.length === 0) {
      classRow = await db.query('INSERT INTO classes (name, section) VALUES ($1, $2) RETURNING id', [className, sectionName]);
    }
    const classId = classRow.rows[0].id;

    let subjectRow = await db.query('SELECT id FROM subjects WHERE name = $1 AND class_id = $2', [subjectName, classId]);
    if (subjectRow.rows.length === 0) {
      subjectRow = await db.query('INSERT INTO subjects (name, class_id) VALUES ($1, $2) RETURNING id', [subjectName, classId]);
    }
    const subjectId = subjectRow.rows[0].id;

    let chapterRow = await db.query('SELECT id FROM chapters WHERE name = $1 AND subject_id = $2', [chapterName, subjectId]);
    if (chapterRow.rows.length === 0) {
      chapterRow = await db.query('INSERT INTO chapters (name, subject_id) VALUES ($1, $2) RETURNING id', [chapterName, subjectId]);
    }
    const chapterId = chapterRow.rows[0].id;

    // Insert Episode
    const newEpisode = await db.query(
      'INSERT INTO episodes (chapter_id, title, video_url, video_data, duration, is_free, thumbnail_url, content_type, is_recent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [chapterId, title, videoUrl, videoData, duration, isFreeBool, thumbnailUrl, contentType, true]
    );

    await db.query('COMMIT');

    res.json({ message: 'Video uploaded successfully', episodeId: newEpisode.rows[0].id });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    const outputPath = path.join(uploadDir, 'compressed-' + req.file.filename);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// GET all videos with class, subject, and chapter info
router.get('/videos', async (req, res) => {
  try {
    const query = `
      SELECT 
        e.id, e.title, e.video_url, e.duration, e.is_free, e.created_at,
        c.name as chapter_name, c.id as chapter_id,
        s.name as subject_name, s.id as subject_id,
        cl.name as class_name, cl.id as class_id, cl.section as section_name
      FROM episodes e
      JOIN chapters c ON e.chapter_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      JOIN classes cl ON s.class_id = cl.id
      ORDER BY e.created_at DESC
    `;
    const result = await db.query(query);
    const makeAbsolute = (url) => {
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

    const mapped = result.rows.map(row => ({
      ...row,
      video_url: makeAbsolute(row.video_url)
    }));
    res.json(mapped);
  } catch (error) {
    console.error('Fetch videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});


// Extract public_id from Cloudinary URL to delete it
const extractPublicId = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const filename = parts.pop();
  const folder = parts.pop();
  const publicId = `${folder}/${filename.split('.')[0]}`;
  return publicId;
};

// PUT update video
router.put('/videos/:id', upload.single('video'), async (req, res) => {
  const { id } = req.params;
  const { sectionName, className, subjectName, chapterName, title, is_free } = req.body;
  const isFreeBool = is_free === 'true' || is_free === true;

  try {
    await db.query('BEGIN');

    // Handle Category mapping
    let classRow = await db.query('SELECT id FROM classes WHERE name = $1 AND section = $2', [className, sectionName]);
    if (classRow.rows.length === 0) {
      classRow = await db.query('INSERT INTO classes (name, section) VALUES ($1, $2) RETURNING id', [className, sectionName]);
    }
    const classId = classRow.rows[0].id;

    let subjectRow = await db.query('SELECT id FROM subjects WHERE name = $1 AND class_id = $2', [subjectName, classId]);
    if (subjectRow.rows.length === 0) {
      subjectRow = await db.query('INSERT INTO subjects (name, class_id) VALUES ($1, $2) RETURNING id', [subjectName, classId]);
    }
    const subjectId = subjectRow.rows[0].id;

    let chapterRow = await db.query('SELECT id FROM chapters WHERE name = $1 AND subject_id = $2', [chapterName, subjectId]);
    if (chapterRow.rows.length === 0) {
      chapterRow = await db.query('INSERT INTO chapters (name, subject_id) VALUES ($1, $2) RETURNING id', [chapterName, subjectId]);
    }
    const chapterId = chapterRow.rows[0].id;

    // Check if new video file is uploaded
    let newVideoUrl = null;
    let newVideoData = null;
    let newDuration = null;
    let newThumbnailUrl = null;
    let contentType = null;

    if (req.file) {
      // 1. Get old video url and thumbnail to delete
      const oldVideoRes = await db.query('SELECT video_url, thumbnail_url FROM episodes WHERE id = $1', [id]);
      const oldVideoUrl = oldVideoRes.rows[0]?.video_url;
      const oldThumbnailUrl = oldVideoRes.rows[0]?.thumbnail_url;

      // 2. Process new video
      const inputPath = req.file.path;
      const outputPath = path.join(uploadDir, 'compressed-' + req.file.filename);
      await processVideoFile(inputPath, outputPath, req.file.size);
      contentType = req.file.mimetype || 'video/mp4';

      console.log('Generating new thumbnail and duration...');
      const metadata = await getDurationAndThumbnail(outputPath, req.file.filename);
      newDuration = metadata.duration;
      newThumbnailUrl = `/uploads/${metadata.thumbnailName}`;

      // Make thumbnail readable by Nginx
      try {
        fs.chmodSync(path.join(uploadDir, metadata.thumbnailName), 0o644);
      } catch (e) {
        console.error('Failed to set permissions on thumbnail:', e.message);
      }

      if (storageMode === 'database') {
        newVideoData = fs.readFileSync(outputPath);
        fs.unlinkSync(outputPath);
      } else {
        newVideoUrl = `/uploads/compressed-${req.file.filename}`;
        // Make video readable by Nginx
        try {
          fs.chmodSync(outputPath, 0o644);
        } catch (e) {
          console.error('Failed to set permissions on video:', e.message);
        }
      }

      // Cleanup old files if they are local filesystem files
      if (oldVideoUrl && oldVideoUrl.startsWith('/uploads')) {
        const oldVideoPath = path.join(__dirname, '..', oldVideoUrl);
        if (fs.existsSync(oldVideoPath)) {
          try { fs.unlinkSync(oldVideoPath); } catch (e) { console.error('Failed to delete old video file:', e); }
        }
      }
      if (oldThumbnailUrl && oldThumbnailUrl.startsWith('/uploads')) {
        const oldThumbPath = path.join(__dirname, '..', oldThumbnailUrl);
        if (fs.existsSync(oldThumbPath)) {
          try { fs.unlinkSync(oldThumbPath); } catch (e) { console.error('Failed to delete old thumbnail file:', e); }
        }
      }

      // Delete old video from Cloudinary if it was a Cloudinary URL
      const oldPublicId = extractPublicId(oldVideoUrl);
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'video' });
        } catch (e) {
          console.error('Failed to delete old video from cloudinary:', e);
        }
      }
    }

    // Update DB
    if (req.file) {
      await db.query(
        `UPDATE episodes 
         SET title = $1, chapter_id = $2, is_free = $3, video_url = $4, video_data = $5, duration = $6, thumbnail_url = $7, content_type = $8 
         WHERE id = $9`,
        [title, chapterId, isFreeBool, newVideoUrl, newVideoData, newDuration, newThumbnailUrl, contentType, id]
      );
    } else {
      await db.query(
        'UPDATE episodes SET title = $1, chapter_id = $2, is_free = $3 WHERE id = $4',
        [title, chapterId, isFreeBool, id]
      );
    }

    await db.query('COMMIT');
    res.json({ message: 'Video updated successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Update error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// DELETE video
router.delete('/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get URL and thumbnail
    const episode = await db.query('SELECT video_url, thumbnail_url FROM episodes WHERE id = $1', [id]);
    if (episode.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const { video_url, thumbnail_url } = episode.rows[0];
    const publicId = extractPublicId(video_url);

    // Delete from DB
    await db.query('DELETE FROM episodes WHERE id = $1', [id]);

    // Delete local files if exist
    if (video_url && video_url.startsWith('/uploads')) {
      const videoPath = path.join(__dirname, '..', video_url);
      if (fs.existsSync(videoPath)) {
        try { fs.unlinkSync(videoPath); } catch (e) { console.error('Failed to delete video file:', e); }
      }
    }
    if (thumbnail_url && thumbnail_url.startsWith('/uploads')) {
      const thumbPath = path.join(__dirname, '..', thumbnail_url);
      if (fs.existsSync(thumbPath)) {
        try { fs.unlinkSync(thumbPath); } catch (e) { console.error('Failed to delete thumbnail file:', e); }
      }
    }

    // Delete from Cloudinary if it was a Cloudinary URL
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      } catch (e) {
        console.error('Failed to delete video from cloudinary:', e);
      }
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Rename Chapter
router.put('/chapters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Chapter name is required' });
    }
    await db.query('UPDATE chapters SET name = $1 WHERE id = $2', [name, id]);
    res.json({ message: 'Chapter renamed successfully' });
  } catch (error) {
    console.error('Rename chapter error:', error);
    res.status(500).json({ error: 'Failed to rename chapter' });
  }
});

// Delete Chapter (and clean up files from disk)
router.delete('/chapters/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get all episodes in this chapter
    const episodesQuery = await db.query('SELECT video_url, thumbnail_url FROM episodes WHERE chapter_id = $1', [id]);
    const episodes = episodesQuery.rows;

    // 2. Begin Transaction
    await db.query('BEGIN');

    // Delete episodes from DB
    await db.query('DELETE FROM episodes WHERE chapter_id = $1', [id]);
    
    // Delete chapter itself
    await db.query('DELETE FROM chapters WHERE id = $1', [id]);

    await db.query('COMMIT');

    // 3. Clean up physical files from disk
    for (const ep of episodes) {
      const { video_url, thumbnail_url } = ep;
      const publicId = extractPublicId(video_url);

      if (video_url && video_url.startsWith('/uploads')) {
        const videoPath = path.join(__dirname, '..', video_url);
        if (fs.existsSync(videoPath)) {
          try { fs.unlinkSync(videoPath); } catch (e) { console.error('Failed to delete video file:', e); }
        }
      }
      if (thumbnail_url && thumbnail_url.startsWith('/uploads')) {
        const thumbPath = path.join(__dirname, '..', thumbnail_url);
        if (fs.existsSync(thumbPath)) {
          try { fs.unlinkSync(thumbPath); } catch (e) { console.error('Failed to delete thumbnail file:', e); }
        }
      }
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        } catch (e) {
          console.error('Failed to delete video from cloudinary:', e);
        }
      }
    }

    res.json({ message: 'Chapter and all associated videos deleted successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Delete chapter error:', error);
    res.status(500).json({ error: 'Failed to delete chapter' });
  }
});

// Rename Subject
router.put('/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Subject name is required' });
    }
    await db.query('UPDATE subjects SET name = $1 WHERE id = $2', [name, id]);
    res.json({ message: 'Subject renamed successfully' });
  } catch (error) {
    console.error('Rename subject error:', error);
    res.status(500).json({ error: 'Failed to rename subject' });
  }
});

// Change Admin Password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user.adminId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const adminQuery = await db.query('SELECT password FROM admins WHERE id = $1', [adminId]);
    if (adminQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    const admin = adminQuery.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE admins SET password = $1 WHERE id = $2', [hashedPassword, adminId]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// GET current privacy policy for admin
router.get('/privacy-policy', async (req, res) => {
  try {
    const result = await db.query("SELECT value FROM settings WHERE key = 'privacy_policy'");
    if (result.rows.length === 0) {
      return res.json({ privacy_policy: '' });
    }
    res.json({ privacy_policy: result.rows[0].value });
  } catch (error) {
    console.error('Failed to fetch privacy policy for admin:', error);
    res.status(500).json({ error: 'Failed to fetch privacy policy' });
  }
});

// UPDATE/PUT privacy policy
router.put('/privacy-policy', async (req, res) => {
  const { privacy_policy } = req.body;
  if (privacy_policy === undefined) {
    return res.status(400).json({ error: 'privacy_policy is required' });
  }
  try {
    const check = await db.query("SELECT key FROM settings WHERE key = 'privacy_policy'");
    if (check.rows.length === 0) {
      await db.query("INSERT INTO settings (key, value) VALUES ('privacy_policy', $1)", [privacy_policy]);
    } else {
      await db.query("UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'privacy_policy'", [privacy_policy]);
    }
    res.json({ message: 'Privacy policy updated successfully' });
  } catch (error) {
    console.error('Failed to update privacy policy:', error);
    res.status(500).json({ error: 'Failed to update privacy policy' });
  }
});

// GET current disclaimer for admin
router.get('/disclaimer', async (req, res) => {
  try {
    const result = await db.query("SELECT value FROM settings WHERE key = 'disclaimer'");
    if (result.rows.length === 0) {
      return res.json({ disclaimer: '' });
    }
    res.json({ disclaimer: result.rows[0].value });
  } catch (error) {
    console.error('Failed to fetch disclaimer for admin:', error);
    res.status(500).json({ error: 'Failed to fetch disclaimer' });
  }
});

// UPDATE/PUT disclaimer
router.put('/disclaimer', async (req, res) => {
  const { disclaimer } = req.body;
  if (disclaimer === undefined) {
    return res.status(400).json({ error: 'disclaimer is required' });
  }
  try {
    const check = await db.query("SELECT key FROM settings WHERE key = 'disclaimer'");
    if (check.rows.length === 0) {
      await db.query("INSERT INTO settings (key, value) VALUES ('disclaimer', $1)", [disclaimer]);
    } else {
      await db.query("UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'disclaimer'", [disclaimer]);
    }
    res.json({ message: 'Disclaimer updated successfully' });
  } catch (error) {
    console.error('Failed to update disclaimer:', error);
    res.status(500).json({ error: 'Failed to update disclaimer' });
  }
});

module.exports = router;
