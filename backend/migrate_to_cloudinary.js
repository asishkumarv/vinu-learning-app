const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim()
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migrate = async () => {
  try {
    console.log('Starting Cloudinary migration...');
    
    // 1. Get Subjects for mapping
    const subRes = await pool.query('SELECT id, name FROM subjects');
    const subjectIds = {};
    subRes.rows.forEach(s => subjectIds[s.name] = s.id);

    // 2. Upload videos from assets
    const videoDir = path.join(__dirname, '..', 'vinu-learning-app', 'assets', 'videos');
    if (!fs.existsSync(videoDir)) {
        console.error('Video directory not found:', videoDir);
        return;
    }

    const files = fs.readdirSync(videoDir);
    console.log(`Found ${files.length} videos to upload.`);

    for (const file of files) {
      if (!file.endsWith('.mp4')) continue;

      const title = file.replace('.mp4', '');
      
      // Check if already uploaded to Cloudinary
      const checkRes = await pool.query('SELECT id, video_url FROM episodes WHERE title = $1', [title]);
      if (checkRes.rows.length > 0 && checkRes.rows[0].video_url) {
          console.log(`Skipping ${title} - already uploaded.`);
          continue;
      }

      console.log(`Uploading ${file} to Cloudinary...`);
      const filePath = path.join(videoDir, file);

      // Upload to Cloudinary
      const uploadRes = await cloudinary.uploader.upload(filePath, {
        resource_type: 'video',
        folder: 'vinu_learning',
        public_id: title.replace(/\s+/g, '_')
      });

      console.log(`Success! URL: ${uploadRes.secure_url}`);

      // Generate thumbnail URL (first frame)
      const thumbnailUrl = uploadRes.secure_url.replace(/\.[^/.]+$/, ".jpg");

      // Determine subject
      let subjectName = 'General';
      if (file.toLowerCase().includes('biology')) subjectName = 'Biology';
      else if (file.toLowerCase().includes('physics')) subjectName = 'Physics';
      else if (file.toLowerCase().includes('social')) subjectName = 'Social Science';

      let subjectId = subjectIds[subjectName];
      if (!subjectId) {
          subjectId = subRes.rows[0]?.id;
          if (!subjectId) {
              console.error('No subjects found in database. Run init_db.js first.');
              return;
          }
      }

      // Create a default chapter if not exists
      const chapterName = 'Chapter 1';
      let chapRes = await pool.query('SELECT id FROM chapters WHERE subject_id = $1 AND name = $2', [subjectId, chapterName]);
      let chapterId;
      if (chapRes.rows.length === 0) {
        chapRes = await pool.query('INSERT INTO chapters (subject_id, name) VALUES ($1, $2) RETURNING id', [subjectId, chapterName]);
        chapterId = chapRes.rows[0].id;
      } else {
        chapterId = chapRes.rows[0].id;
      }

      // Upsert episode with Cloudinary URL and NULL video_data
      await pool.query(
        `INSERT INTO episodes (chapter_id, title, video_url, video_data, thumbnail_url, content_type, is_recent) 
         VALUES ($1, $2, $3, NULL, $4, $5, $6)
         ON CONFLICT (title) DO UPDATE SET video_url = $3, video_data = NULL, thumbnail_url = $4`,
        [chapterId, title, uploadRes.secure_url, thumbnailUrl, 'video/mp4', true]
      );
      console.log(`Updated database for ${title}`);
    }

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await pool.end();
  }
};

migrate();
