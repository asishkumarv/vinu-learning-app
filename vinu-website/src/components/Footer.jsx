import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Shield, AlertTriangle, BookOpen, Smartphone } from 'lucide-react';

export default function Footer({ websiteConfig }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div>
            <div className="brand-logo-container" style={{ marginBottom: '1rem' }}>
              <img src="/newlogo1.png" alt="Vinuh Logo" className="brand-logo-img" />
              <div className="brand-text-block">
                <span className="brand-title">VINUH</span>
                <span className="brand-subtitle">Listen & Learn</span>
              </div>
            </div>
            <p className="footer-brand-desc">
              Vinuh is a premier micro-learning education platform crafted for school and intermediate students across Andhra Pradesh and Telangana, providing chapter-wise audio & video lessons and foundational life skills.
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} style={{ color: 'var(--primary-color)' }} />
                <span>Vertical Seed Studios Pvt Ltd, Ameerpet, Hyderabad - 500038</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} style={{ color: 'var(--primary-color)' }} />
                <span>{websiteConfig?.supportEmail || 'contact@vinuh.in'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} style={{ color: 'var(--primary-color)' }} />
                <span>{websiteConfig?.supportPhone || '+91 98765 43210'}</span>
              </div>
            </div>
          </div>

          {/* Syllabus & Curriculums */}
          <div>
            <h4 className="footer-heading">Curriculum & Boards</h4>
            <ul className="footer-links-list">
              <li><a href="#syllabus">AP State Board (8th Class)</a></li>
              <li><a href="#syllabus">AP State Board (9th Class)</a></li>
              <li><a href="#syllabus">AP State Board (10th SSC)</a></li>
              <li><a href="#syllabus">Telangana State Board (8th - 10th)</a></li>
              <li><a href="#syllabus">Intermediate (1st & 2nd Year)</a></li>
              <li><a href="#life-lessons">Life Lessons & Moral Values</a></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer-heading">Explore App</h4>
            <ul className="footer-links-list">
              <li><a href="#about">About Vinuh Platform</a></li>
              <li><a href="#showcase">Mobile App Interface</a></li>
              <li><a href="#life-lessons">Life Lessons Series</a></li>
              <li><a href="#download">Download APK</a></li>
              <li><a href={websiteConfig?.playStoreUrl || '#'} target="_blank" rel="noreferrer">Google Play Store</a></li>
            </ul>
          </div>

          {/* Legal & Policy Links */}
          <div>
            <h4 className="footer-heading">Legal & Compliance</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/disclaimer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={15} style={{ color: 'var(--primary-color)' }} />
                  <span>Educational Disclaimer</span>
                </Link>
              </li>
              <li>
                <Link to="/terms" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={15} style={{ color: 'var(--primary-color)' }} />
                  <span>Privacy Policy & Terms</span>
                </Link>
              </li>
              <li>
                <Link to="/terms#liability">Limitation of Liability</Link>
              </li>
              <li>
                <Link to="/terms#child-safety">Student & Child Data Policy</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} Vinuh (Vertical Seed Studios Pvt Ltd). All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/disclaimer">Disclaimer</Link>
            <Link to="/terms">Terms of Use</Link>
            <Link to="/terms">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
