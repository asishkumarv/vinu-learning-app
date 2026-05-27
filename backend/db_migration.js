const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migrate = async () => {
  try {
    console.log('Starting Database Migration...');

    // 1. Add section column to classes table if it doesn't exist
    await pool.query(`
      ALTER TABLE classes 
      ADD COLUMN IF NOT EXISTS section VARCHAR(50) DEFAULT 'AP school';
    `);
    console.log('Confirmed "section" column in classes table.');

    // 2. Ensure existing classes default to 'AP school' if they have null section
    await pool.query(`
      UPDATE classes SET section = 'AP school' WHERE section IS NULL;
    `);

    // 3. Define classes for the 4 sections
    const sectionsData = {
      'AP school': ['8th Class', '9th Class', '10th Class'],
      'Telangana school': ['8th Class', '9th Class', '10th Class'],
      'Intermediate': ['1st Year', '2nd Year'],
      'Life Skills': ['Life Skills Course']
    };

    // Insert classes
    for (const [sectionName, classNames] of Object.entries(sectionsData)) {
      for (const className of classNames) {
        // Check if class already exists in this section
        const classExist = await pool.query(
          'SELECT id FROM classes WHERE name = $1 AND section = $2',
          [className, sectionName]
        );

        let classId;
        if (classExist.rows.length === 0) {
          const insertRes = await pool.query(
            'INSERT INTO classes (name, section) VALUES ($1, $2) RETURNING id',
            [className, sectionName]
          );
          classId = insertRes.rows[0].id;
          console.log(`Inserted Class: "${className}" under section "${sectionName}"`);
        } else {
          classId = classExist.rows[0].id;
          console.log(`Class: "${className}" under section "${sectionName}" already exists.`);
        }

        // Add default subjects for the newly created classes (to make the UI beautiful and populated)
        if (sectionName === 'Telangana school' && className === '10th Class') {
          await ensureSubject(classId, 'Maths (TS)');
          await ensureSubject(classId, 'Science (TS)');
          await ensureSubject(classId, 'Social Science (TS)');
        } else if (sectionName === 'Intermediate' && className === '1st Year') {
          await ensureSubject(classId, 'Maths 1A');
          await ensureSubject(classId, 'Physics 1');
        } else if (sectionName === 'Life Skills' && className === 'Life Skills Course') {
          await ensureSubject(classId, 'Spoken English');
          await ensureSubject(classId, 'Digital Literacy');
          await ensureSubject(classId, 'Personality Development');
        }
      }
    }

    console.log('Database Migration and Seeding Complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
};

const ensureSubject = async (classId, subjectName) => {
  // Check if subject exists for this class
  const subCheck = await pool.query(
    'SELECT id FROM subjects WHERE class_id = $1 AND name = $2',
    [classId, subjectName]
  );

  let subjectId;
  if (subCheck.rows.length === 0) {
    const res = await pool.query(
      'INSERT INTO subjects (class_id, name) VALUES ($1, $2) RETURNING id',
      [classId, subjectName]
    );
    subjectId = res.rows[0].id;
    console.log(`  Added Subject: "${subjectName}"`);
  } else {
    subjectId = subCheck.rows[0].id;
  }

  // Ensure at least one chapter and episode exists for the subject so lessons are shown
  const chapCheck = await pool.query(
    'SELECT id FROM chapters WHERE subject_id = $1 AND name = $2',
    [subjectId, 'Chapter 1']
  );

  let chapterId;
  if (chapCheck.rows.length === 0) {
    const res = await pool.query(
      'INSERT INTO chapters (subject_id, name) VALUES ($1, $2) RETURNING id',
      [subjectId, 'Chapter 1']
    );
    chapterId = res.rows[0].id;
    console.log(`    Added Chapter: "Chapter 1"`);
  } else {
    chapterId = chapCheck.rows[0].id;
  }

  // Ensure at least one lesson episode exists
  const epCheck = await pool.query(
    'SELECT id FROM episodes WHERE chapter_id = $1',
    [chapterId]
  );

  if (epCheck.rows.length === 0) {
    await pool.query(
      `INSERT INTO episodes (chapter_id, title, thumbnail_url, duration, is_free, is_recent) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        chapterId,
        `Introduction to ${subjectName}`,
        'https://img.freepik.com/free-vector/digital-online-education-background-concept-vector_1017-37513.jpg',
        300,
        true,
        true
      ]
    );
    console.log(`      Added Episode: "Introduction to ${subjectName}"`);
  }
};

migrate();
