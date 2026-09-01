import React, { useState, useEffect } from 'react';
import { contentApi } from '../services/api';
import { AlertTriangle, Shield, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const defaultDisclaimer = `VINUH — EDUCATIONAL DISCLAIMER & LIMITATION OF LIABILITY

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

export default function DisclaimerPage() {
  const [disclaimerText, setDisclaimerText] = useState(defaultDisclaimer);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchPolicy = async () => {
      try {
        const text = await contentApi.getDisclaimer();
        if (text && text.trim().length > 0) {
          setDisclaimerText(text);
        }
      } catch (err) {
        console.error('Failed to load disclaimer from backend:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  return (
    <div className="legal-container">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-color)', fontWeight: '600', marginBottom: '1.5rem' }}>
        <ArrowLeft size={18} />
        <span>Back to Home</span>
      </Link>

      <div className="legal-header">
        <div className="legal-badge">
          <AlertTriangle size={15} />
          <span>Legal & Policy</span>
        </div>
        <h1 className="legal-title">Educational Disclaimer & Limitation of Liability</h1>
        <div className="legal-date">Last Updated: August 2026 | Synchronized with Official Database</div>
      </div>

      <div className="legal-content-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            Loading live disclaimer from server...
          </div>
        ) : (
          disclaimerText
        )}
      </div>
    </div>
  );
}
