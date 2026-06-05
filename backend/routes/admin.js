const express = require('express');
const router = express.Router();
const db = require('../db');
const adminAuth = require('../middleware/adminAuth');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const cloudinary = require('cloudinary').v2;

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim()
});

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

router.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const { className, subjectName, chapterName, title, is_free } = req.body;
  const isFreeBool = is_free === 'true' || is_free === true;

  try {
    const inputPath = req.file.path;
    const outputPath = path.join(uploadDir, 'compressed-' + req.file.filename);

    console.log('Compressing video:', inputPath);

    // Compress using ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .outputOptions([
          '-crf 28',
          '-preset veryfast',
          '-movflags +faststart'
        ])
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(outputPath);
    });

    console.log('Uploading to Cloudinary:', outputPath);
    
    // Upload to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(outputPath, {
      resource_type: 'video',
      folder: 'vinu-learning-app'
    });

    // Cleanup temp files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    // Get DB objects, create if not exist
    await db.query('BEGIN');

    let classRow = await db.query('SELECT id FROM classes WHERE name = $1', [className]);
    if (classRow.rows.length === 0) {
      classRow = await db.query('INSERT INTO classes (name) VALUES ($1) RETURNING id', [className]);
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
    const thumbnailUrl = uploadRes.secure_url.replace(/\.[^/.]+$/, ".jpg");
    
    const newEpisode = await db.query(
      'INSERT INTO episodes (chapter_id, title, video_url, duration, is_free, thumbnail_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [chapterId, title, uploadRes.secure_url, Math.floor(uploadRes.duration || 0), isFreeBool, thumbnailUrl]
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
        cl.name as class_name, cl.id as class_id
      FROM episodes e
      JOIN chapters c ON e.chapter_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      JOIN classes cl ON s.class_id = cl.id
      ORDER BY e.created_at DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
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
  const { className, subjectName, chapterName, title, is_free } = req.body;
  const isFreeBool = is_free === 'true' || is_free === true;

  try {
    await db.query('BEGIN');

    // Handle Category mapping
    let classRow = await db.query('SELECT id FROM classes WHERE name = $1', [className]);
    if (classRow.rows.length === 0) {
      classRow = await db.query('INSERT INTO classes (name) VALUES ($1) RETURNING id', [className]);
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
    let newDuration = null;
    let newThumbnailUrl = null;

    if (req.file) {
      // 1. Get old video url to delete
      const oldVideoRes = await db.query('SELECT video_url FROM episodes WHERE id = $1', [id]);
      const oldVideoUrl = oldVideoRes.rows[0]?.video_url;

      // 2. Compress new video
      const inputPath = req.file.path;
      const outputPath = path.join(uploadDir, 'compressed-' + req.file.filename);
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .videoCodec('libx264')
          .outputOptions(['-crf 28', '-preset veryfast', '-movflags +faststart'])
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .save(outputPath);
      });

      // 3. Upload to Cloudinary
      const uploadRes = await cloudinary.uploader.upload(outputPath, {
        resource_type: 'video',
        folder: 'vinu-learning-app'
      });
      newVideoUrl = uploadRes.secure_url;
      newDuration = Math.floor(uploadRes.duration || 0);
      newThumbnailUrl = uploadRes.secure_url.replace(/\.[^/.]+$/, ".jpg");

      // 4. Delete local temp files
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);

      // 5. Delete old video from Cloudinary
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
    if (newVideoUrl) {
      await db.query(
        'UPDATE episodes SET title = $1, chapter_id = $2, is_free = $3, video_url = $4, duration = $5, thumbnail_url = $6 WHERE id = $7',
        [title, chapterId, isFreeBool, newVideoUrl, newDuration, newThumbnailUrl, id]
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
    
    // Get URL to delete from Cloudinary
    const episode = await db.query('SELECT video_url FROM episodes WHERE id = $1', [id]);
    if (episode.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const videoUrl = episode.rows[0].video_url;
    const publicId = extractPublicId(videoUrl);

    // Delete from DB
    await db.query('DELETE FROM episodes WHERE id = $1', [id]);

    // Delete from Cloudinary
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

module.exports = router;
