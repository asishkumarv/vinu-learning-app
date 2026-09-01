import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Download, Menu, X, BookOpen, Shield, AlertTriangle } from 'lucide-react';

export default function Navbar({ websiteConfig }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/';

  return (
    <>
      {websiteConfig?.announcement && (
        <div className="announcement-bar">
          <span>{websiteConfig.announcement}</span>
        </div>
      )}
      <header className="navbar">
        <div className="container">
          <div className="navbar-inner">
            {/* Brand Logo */}
            <Link to="/" className="brand-logo-container">
              <img src="/newlogo1.png" alt="Vinuh Logo" className="brand-logo-img" />
              <div className="brand-text-block">
                <span className="brand-title">VINUH</span>
                <span className="brand-subtitle">Listen & Learn</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav>
              <ul className="nav-links">
                <li>
                  <Link to="/" className={`nav-link ${isHome ? 'active' : ''}`}>
                    Home
                  </Link>
                </li>
                {isHome ? (
                  <>
                    <li><a href="#about" className="nav-link">About App</a></li>
                    <li><a href="#syllabus" className="nav-link">AP & TS Syllabus</a></li>
                    <li><a href="#life-lessons" className="nav-link">Life Lessons</a></li>
                    <li><a href="#showcase" className="nav-link">App Showcase</a></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/#about" className="nav-link">About</Link></li>
                    <li><Link to="/#syllabus" className="nav-link">Syllabus</Link></li>
                  </>
                )}
                <li>
                  <Link to="/disclaimer" className={`nav-link ${location.pathname === '/disclaimer' ? 'active' : ''}`}>
                    Disclaimer
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className={`nav-link ${location.pathname === '/terms' ? 'active' : ''}`}>
                    Terms & Privacy
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Right Action Buttons */}
            <div className="nav-actions">
              <button 
                className="theme-toggle-btn" 
                onClick={toggleTheme} 
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <a 
                href={websiteConfig?.appDownloadUrl || '#download'} 
                className="btn btn-primary"
                style={{ borderRadius: 'var(--radius-full)', padding: '0.6rem 1.35rem' }}
              >
                <Download size={18} />
                <span>Get App</span>
              </a>

              {/* Mobile Menu Trigger */}
              <button 
                className="mobile-menu-btn"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle Mobile Navigation"
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="mobile-drawer open">
            <Link to="/" onClick={() => setMobileOpen(false)} className="nav-link">Home</Link>
            <a href="#about" onClick={() => setMobileOpen(false)} className="nav-link">About App</a>
            <a href="#syllabus" onClick={() => setMobileOpen(false)} className="nav-link">AP & TS Syllabus</a>
            <a href="#life-lessons" onClick={() => setMobileOpen(false)} className="nav-link">Life Lessons</a>
            <a href="#showcase" onClick={() => setMobileOpen(false)} className="nav-link">App Showcase</a>
            <Link to="/disclaimer" onClick={() => setMobileOpen(false)} className="nav-link">Disclaimer</Link>
            <Link to="/terms" onClick={() => setMobileOpen(false)} className="nav-link">Terms & Privacy Policy</Link>
            
            <a 
              href={websiteConfig?.appDownloadUrl || '#download'} 
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={() => setMobileOpen(false)}
            >
              <Download size={18} />
              <span>Download Vinuh App</span>
            </a>
          </div>
        )}
      </header>
    </>
  );
}
