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
          size: '640x360'
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
              size: '640x360'
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

router.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const { sectionName, className, subjectName, chapterName, title, is_free } = req.body;
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

    // Cleanup raw input file
    fs.unlinkSync(inputPath);

    let videoUrl = null;
    let videoData = null;
    let duration = 0;
    let thumbnailUrl = null;
    let contentType = req.file.mimetype || 'video/mp4';

    console.log('Generating thumbnail and duration...');
    const metadata = await getDurationAndThumbnail(outputPath, req.file.filename);
    duration = metadata.duration;
    thumbnailUrl = `/uploads/${metadata.thumbnailName}`;

    if (storageMode === 'database') {
      console.log('Reading video into database buffer...');
      videoData = fs.readFileSync(outputPath);
      // Clean up compressed video from disk
      fs.unlinkSync(outputPath);
    } else {
      // Local storage
      videoUrl = `/uploads/compressed-${req.file.filename}`;
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
      'INSERT INTO episodes (chapter_id, title, video_url, video_data, duration, is_free, thumbnail_url, content_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [chapterId, title, videoUrl, videoData, duration, isFreeBool, thumbnailUrl, contentType]
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
      const protocol = req.protocol;
      const host = req.get('host');
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

      // Cleanup raw file
      fs.unlinkSync(inputPath);
      contentType = req.file.mimetype || 'video/mp4';

      console.log('Generating new thumbnail and duration...');
      const metadata = await getDurationAndThumbnail(outputPath, req.file.filename);
      newDuration = metadata.duration;
      newThumbnailUrl = `/uploads/${metadata.thumbnailName}`;

      if (storageMode === 'database') {
        newVideoData = fs.readFileSync(outputPath);
        fs.unlinkSync(outputPath);
      } else {
        newVideoUrl = `/uploads/compressed-${req.file.filename}`;
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

module.exports = router;
