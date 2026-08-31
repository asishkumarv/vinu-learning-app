const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const disclaimerText = `VINUH — EDUCATIONAL DISCLAIMER & LIMITATION OF LIABILITY

Effective Date: 26/08/2026

Vinuh makes reasonable efforts to provide useful, accurate and educational content. However:

* Educational content may contain errors, omissions, outdated information or differences of interpretation;
* Content may be prepared by teachers, subject experts, contributors, editors or technology-assisted systems;
* Vinuh does not guarantee that every lesson, answer, explanation or recommendation is error-free or suitable for every learner;
* Examination patterns, syllabi, regulations, career information and educational requirements may change;
* Users should verify important academic, examination, admission, financial, career or other consequential information from authoritative sources.

Vinuh shall not be responsible for academic results, examination scores, admissions, employment outcomes, career decisions or other consequences arising solely from reliance on content available through the Services.

AI-ASSISTED OR TECHNOLOGY-ASSISTED CONTENT
Where technology, automation or artificial intelligence is used in creating, processing, translating, recommending or presenting educational material, such output may contain inaccuracies or unintended errors.
AI-assisted content is provided for educational and informational purposes and should be independently verified where accuracy is important.
Vinuh does not represent that AI-assisted material is equivalent to professional human advice or officially issued educational material.

LIMITATION OF LIABILITY
To the maximum extent permitted by applicable law, Vinuh and the Company shall not be liable for indirect, incidental, consequential, special or unforeseeable losses arising from use of or inability to use the Services.
The Company does not guarantee educational, academic, examination, employment, financial or career outcomes from use of Vinuh.
Nothing in this Policy is intended to exclude or limit liability that cannot lawfully be excluded or limited under applicable law.`;

const migrate = async () => {
  try {
    console.log('Starting Migration: Seeding User Disclaimer...');
    
    // Ensure settings table exists (in case it wasn't run earlier)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert or update disclaimer key
    await pool.query(`
      INSERT INTO settings (key, value)
      VALUES ('disclaimer', $1)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
    `, [disclaimerText.trim()]);
    
    console.log('Seeded User Disclaimer successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
};

migrate();
