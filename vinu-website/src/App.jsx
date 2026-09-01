import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { contentApi } from './services/api';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import DisclaimerPage from './pages/DisclaimerPage';
import TermsPrivacyPage from './pages/TermsPrivacyPage';

export default function App() {
  const [websiteConfig, setWebsiteConfig] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await contentApi.getWebsiteConfig();
        if (config) {
          setWebsiteConfig(config);
        }
      } catch (err) {
        console.error('Failed to load website config:', err);
      }
    };
    loadConfig();
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar websiteConfig={websiteConfig} />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage websiteConfig={websiteConfig} />} />
              <Route path="/disclaimer" element={<DisclaimerPage />} />
              <Route path="/terms" element={<TermsPrivacyPage />} />
              <Route path="/privacy-policy" element={<TermsPrivacyPage />} />
            </Routes>
          </main>
          <Footer websiteConfig={websiteConfig} />
        </div>
      </Router>
    </ThemeProvider>
  );
}
