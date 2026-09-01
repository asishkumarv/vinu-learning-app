import React, { useState } from 'react';
import PhoneMockup from '../components/PhoneMockup';
import { 
  Download, Play, BookOpen, Compass, Award, Sparkles, Check, 
  Smartphone, GraduationCap, Video, Users, ArrowRight, ShieldCheck, Heart
} from 'lucide-react';

export default function HomePage({ websiteConfig }) {
  const [activeScreenIndex, setActiveScreenIndex] = useState(0);
  const [selectedBoard, setSelectedBoard] = useState('ap'); // 'ap', 'ts', 'inter', 'life'

  const screensInfo = [
    {
      title: 'Home & Syllabus Explorer',
      badge: 'Board Specific',
      desc: 'Seamlessly toggle between AP School, Telangana School, and Intermediate syllabus with categorized class selectors.',
    },
    {
      title: 'Smart Instant Search',
      badge: 'Quick Navigation',
      desc: 'Search chapters and subjects effortlessly with recent search history and trending topic recommendations.',
    },
    {
      title: 'Audio-Visual Lesson Player',
      badge: 'Dr. Vinuh Series',
      desc: 'Engaging chapter episodes with rich visual explanations, animated posters (e.g. 10th Class Chapter Lessons), and intuitive playback.',
    },
    {
      title: 'Student Profile & Progress',
      badge: 'Learning Tracking',
      desc: 'Keep track of watched videos, completed quizzes, custom dark mode, and student personalized preferences.',
    },
  ];

  const syllabusData = {
    ap: {
      name: 'Andhra Pradesh State Board (SCERT AP)',
      classes: '8th, 9th & 10th (SSC)',
      color: '#0084FF',
      description: 'Comprehensive chapter-wise audio and video breakdowns strictly aligned with the AP Board textbook curriculum and state board examination pattern.',
      subjects: ['Telugu', 'Mathematics', 'Physical Science', 'Biological Science', 'Social Studies', 'English'],
      highlight: 'Special focus on SSC 10th Class public exam preparation and high-scoring conceptual clarity.'
    },
    ts: {
      name: 'Telangana State Board (SCERT Telangana)',
      classes: '8th, 9th & 10th (SSC)',
      color: '#F97316',
      description: 'Tailored for Telangana syllabus with high-clarity Telugu and bilingual video lessons crafted to simplify core concepts.',
      subjects: ['1st Language Telugu', 'Mathematics', 'General Science (Physical & Bio)', 'Social Studies', 'English', 'Hindi'],
      highlight: 'Covers all textbook lesson exercises, important questions, and quick revision notes.'
    },
    inter: {
      name: 'Intermediate 1st & 2nd Year (BIE AP & TS)',
      classes: 'Junior & Senior Inter (MPC, BiPC, CEC, HEC)',
      color: '#EC4899',
      description: 'Foundational and advanced video series breaking down intermediate subject chapters for board exams and competitive entrance readiness.',
      subjects: ['Mathematics 1A/1B & 2A/2B', 'Physics', 'Chemistry', 'Botany & Zoology', 'Commerce & Economics', 'Civics & History'],
      highlight: 'Concept-first micro-learning to maximize retention without academic overwhelm.'
    },
    life: {
      name: 'Basic Life Lessons & Moral Values',
      classes: 'For All Students & Young Minds',
      color: '#10B981',
      description: 'Inspiring life values, moral ethics, emotional intelligence, and resilience lessons for character building and overall mindset growth.',
      subjects: ['Life & Responsibilities', 'Moral Values & Ethics', 'Goal Setting & Focus', 'Health & Mindset', 'Family & Respect'],
      highlight: 'Holistic character development that builds responsible, empathetic, and confident citizens.'
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Background Ambient Glows */}
      <div className="ambient-glow ambient-glow-1"></div>
      <div className="ambient-glow ambient-glow-2"></div>
      <div className="ambient-glow ambient-glow-3"></div>

      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="hero-badge">
                <Sparkles size={16} />
                <span>Smart Micro-Learning App</span>
              </div>

              <h1 className="hero-title">
                {websiteConfig?.heroTagline ? (
                  websiteConfig.heroTagline
                ) : (
                  <>
                    Listen & Learn with <span className="gradient-text">VINUH</span>
                  </>
                )}
              </h1>

              <p className="hero-subtitle">
                {websiteConfig?.heroSubtitle || 
                  'Transform school and intermediate learning into high-retention audio & video lessons. Specially designed for AP & Telangana students, plus essential life lessons for holistic growth.'}
              </p>

              <div className="hero-ctas">
                <a href={websiteConfig?.appDownloadUrl || '#download'} className="btn btn-primary btn-lg">
                  <Download size={20} />
                  <span>Download App (Free)</span>
                </a>
                <a href="#syllabus" className="btn btn-secondary btn-lg">
                  <BookOpen size={20} />
                  <span>Explore Syllabus</span>
                </a>
              </div>

              <div className="hero-stats-row">
                <div>
                  <div className="stat-item-title">AP & TS</div>
                  <div className="stat-item-label">State Board Syllabi</div>
                </div>
                <div>
                  <div className="stat-item-title">8th – Inter</div>
                  <div className="stat-item-label">Classes Covered</div>
                </div>
                <div>
                  <div className="stat-item-title">100%</div>
                  <div className="stat-item-label">Conceptual Focus</div>
                </div>
              </div>
            </div>

            {/* Interactive Phone Mockup */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <PhoneMockup 
                activeScreen={activeScreenIndex} 
                onScreenChange={(idx) => setActiveScreenIndex(idx)} 
              />
              <div className="mockup-controls">
                {screensInfo.map((s, i) => (
                  <button 
                    key={i}
                    className={`mockup-tab-btn ${activeScreenIndex === i ? 'active' : ''}`}
                    onClick={() => setActiveScreenIndex(i)}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT VINUH APP SECTION */}
      <section id="about" className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">About Vinuh</span>
            <h2 className="section-title">What is Vinuh App?</h2>
            <p className="section-desc">
              Vinuh is an innovative Telugu & bilingual educational micro-learning platform designed to make academic curriculum memorable, stress-free, and accessible for every student.
            </p>
          </div>

          <div className="cards-grid">
            <div className="feature-card">
              <div className="card-icon" style={{ background: 'rgba(0, 132, 255, 0.15)', color: '#0084FF' }}>
                <GraduationCap size={28} />
              </div>
              <h3 className="card-title">Curriculum-Aligned</h3>
              <p className="card-text">
                Every episode is strictly aligned with Andhra Pradesh (SCERT AP) and Telangana state board textbooks and Intermediate board patterns.
              </p>
            </div>

            <div className="feature-card">
              <div className="card-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#F97316' }}>
                <Video size={28} />
              </div>
              <h3 className="card-title">Audio & Video Micro-Lessons</h3>
              <p className="card-text">
                Bite-sized episodes presented with engaging narratives, clear visual aids, and Dr. Vinuh’s expert presentation for rapid concept absorption.
              </p>
            </div>

            <div className="feature-card">
              <div className="card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                <Heart size={28} />
              </div>
              <h3 className="card-title">Foundational Life Lessons</h3>
              <p className="card-text">
                Beyond school textbooks, Vinuh teaches essential human values, life responsibilities, perseverance, and emotional intelligence for young minds.
              </p>
            </div>

            <div className="feature-card">
              <div className="card-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#EC4899' }}>
                <Smartphone size={28} />
              </div>
              <h3 className="card-title">Seamless Mobile Experience</h3>
              <p className="card-text">
                Designed with dark & light themes, instant topic search, progress tracking, and effortless offline-ready streaming.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SYLLABUS & CURRICULUM EXPLORER */}
      <section id="syllabus" className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Curriculum Coverage</span>
            <h2 className="section-title">Tailored for AP, Telangana & Intermediate</h2>
            <p className="section-desc">
              Select your academic board to see the subjects, classes, and special pedagogical focus provided inside the Vinuh App.
            </p>
          </div>

          {/* Board Selector Tabs */}
          <div className="syllabus-board-tabs">
            <button 
              className={`board-tab ${selectedBoard === 'ap' ? 'active' : ''}`}
              onClick={() => setSelectedBoard('ap')}
            >
              <span className="board-dot" style={{ background: '#38BDF8' }}></span>
              <span>AP School (8th, 9th, 10th)</span>
            </button>

            <button 
              className={`board-tab ${selectedBoard === 'ts' ? 'active' : ''}`}
              onClick={() => setSelectedBoard('ts')}
            >
              <span className="board-dot" style={{ background: '#F97316' }}></span>
              <span>Telangana School (8th, 9th, 10th)</span>
            </button>

            <button 
              className={`board-tab ${selectedBoard === 'inter' ? 'active' : ''}`}
              onClick={() => setSelectedBoard('inter')}
            >
              <span className="board-dot" style={{ background: '#EC4899' }}></span>
              <span>Intermediate (1st & 2nd Year)</span>
            </button>

            <button 
              className={`board-tab ${selectedBoard === 'life' ? 'active' : ''}`}
              onClick={() => setSelectedBoard('life')}
            >
              <span className="board-dot" style={{ background: '#10B981' }}></span>
              <span>Life Lessons & Values</span>
            </button>
          </div>

          {/* Dynamic Content Box */}
          <div className="syllabus-content-box" style={{ borderTop: `4px solid ${syllabusData[selectedBoard].color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: syllabusData[selectedBoard].color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {syllabusData[selectedBoard].classes}
                </span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem' }}>
                  {syllabusData[selectedBoard].name}
                </h3>
              </div>
              <div style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', background: 'rgba(0,132,255,0.1)', color: 'var(--primary-color)', fontSize: '0.875rem', fontWeight: '600' }}>
                Full Chapter Breakdown
              </div>
            </div>

            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1.5rem' }}>
              {syllabusData[selectedBoard].description}
            </p>

            <div style={{ padding: '1rem 1.25rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldCheck size={22} color={syllabusData[selectedBoard].color} />
              <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                {syllabusData[selectedBoard].highlight}
              </span>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Subjects & Core Modules:
            </h4>
            <div className="subject-tag-list">
              {syllabusData[selectedBoard].subjects.map((sub, i) => (
                <div key={i} className="subject-tag" style={{ borderColor: 'var(--border-color)' }}>
                  <Check size={14} color={syllabusData[selectedBoard].color} style={{ marginRight: '6px' }} />
                  {sub}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE APP SHOWCASE (Using the 4 App Screens) */}
      <section id="showcase" className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Interactive Preview</span>
            <h2 className="section-title">Designed for Focus & Retention</h2>
            <p className="section-desc">
              Explore how Vinuh app simplifies learning through dedicated board selections, fast search, audio-visual storytelling, and progress tracking.
            </p>
          </div>

          <div className="screen-showcase-container">
            {/* Left: Detailed Info List */}
            <div className="screen-info-list">
              {screensInfo.map((info, idx) => (
                <div 
                  key={idx}
                  className={`screen-info-item ${activeScreenIndex === idx ? 'active' : ''}`}
                  onClick={() => setActiveScreenIndex(idx)}
                >
                  <div className="screen-info-item-title">
                    <span style={{ color: 'var(--primary-color)' }}>0{idx + 1}.</span>
                    <span>{info.title}</span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(0,132,255,0.15)', color: 'var(--primary-color)', marginLeft: 'auto' }}>
                      {info.badge}
                    </span>
                  </div>
                  <p className="screen-info-item-desc">
                    {info.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Right: Phone Mockup Frame */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PhoneMockup 
                activeScreen={activeScreenIndex} 
                onScreenChange={(idx) => setActiveScreenIndex(idx)} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. LIFE LESSONS FEATURE SPOTLIGHT */}
      <section id="life-lessons" className="section">
        <div className="container">
          <div className="cta-banner" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #451a03 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'inline-block', padding: '0.35rem 1rem', borderRadius: 'var(--radius-full)', background: 'rgba(253, 224, 71, 0.2)', color: '#FDE047', fontSize: '0.85rem', fontWeight: '700', marginBottom: '1.25rem' }}>
              SPECIAL LESSON SERIES
            </div>
            <h2>Life Lessons — Values, Responsibility & Hope</h2>
            <p>
              Inspiring life lessons, values, perseverance, and guidance presented by Manasa Defence Academy & Dr. Vinuh to guide students beyond examinations into successful, grounded human beings.
            </p>
            <div className="cta-badges-row">
              <a href="#download" className="btn btn-primary btn-lg" style={{ background: 'var(--primary-gradient)' }}>
                <Play size={18} />
                <span>Listen to Episodes</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DOWNLOAD APP BANNER */}
      <section id="download" className="section" style={{ paddingTop: '2rem' }}>
        <div className="container">
          <div className="cta-banner">
            <h2>Ready to Start Listening & Learning?</h2>
            <p>
              Download Vinuh App today and experience the smartest way to master AP & Telangana school and intermediate syllabus.
            </p>
            <div className="cta-badges-row">
              <a 
                href={websiteConfig?.appDownloadUrl || '#'} 
                className="btn btn-secondary btn-lg"
                style={{ background: '#FFFFFF', color: '#0055FF', fontWeight: '700' }}
              >
                <Download size={20} />
                <span>Download Android APK</span>
              </a>
              {websiteConfig?.playStoreUrl && (
                <a 
                  href={websiteConfig.playStoreUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-secondary btn-lg"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.3)' }}
                >
                  <Smartphone size={20} />
                  <span>Google Play Store</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
