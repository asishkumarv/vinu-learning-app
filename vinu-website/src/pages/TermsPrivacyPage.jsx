import React, { useState, useEffect } from 'react';
import { contentApi } from '../services/api';
import { Shield, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const defaultPrivacyPolicy = `VINUH — PRIVACY POLICY, USER DISCLAIMER & TERMS OF USE

Effective Date: 26/08/2026

Vinuh (“Vinuh”, “we”, “us”, “our”) is an educational micro-learning platform operated by Vertical Seed Studios Pvt Ltd, having its registered office at 303, Divyashakthi Bhavan, Srinivasa Nagar west, Ameerpet, Hyderabad-500038.
This Privacy Policy, User Disclaimer and Terms of Use (“Policy”) explains how Vinuh collects, uses, stores and protects information, and the terms under which users access and use the Vinuh application, website and related services (“Services”).

By registering, accessing or using Vinuh, you acknowledge that you have read and understood this Policy and agree to the applicable Terms of Use. If you do not agree, please do not use the Services.

1. NATURE OF VINUH
Vinuh provides short-form educational and learning content, including audio lessons, videos, study materials, learning resources, assessments, recommendations, career-related information and other educational content.
Vinuh is intended as a supplementary learning platform and does not replace a school, college, teacher, tutor, educational institution, professional adviser or officially prescribed curriculum.

2. INFORMATION WE MAY COLLECT
Depending on the features used, Vinuh may collect:
* Name or display name;
* Mobile number and/or email address;
* Age or age category and educational level/class;
* Login and authentication information;
* Subscription and transaction-related information;
* Learning activity, course selections, lesson completion and progress;
* Device, application and technical information reasonably required to operate, secure and improve the Services.

3. HOW WE USE INFORMATION
We use information to provide educational content, manage user accounts, maintain learning progress, secure our platform, and comply with law. We do not sell personal data.

4. CHILDREN AND STUDENTS
Vinuh may be used by school and college students. Where applicable law requires parental or lawful-guardian consent, Vinuh will implement appropriate safeguards.

5. INTELLECTUAL PROPERTY
All Vinuh software, branding, logos, names, interface elements, original audio/video content, text, graphics and designs are owned by or licensed to the Company.

6. GOVERNING LAW & JURISDICTION
This Policy shall be governed by the laws of India, subject to the jurisdiction of the courts at Hyderabad, Telangana.`;

export default function TermsPrivacyPage() {
  const [policyText, setPolicyText] = useState(defaultPrivacyPolicy);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchPolicy = async () => {
      try {
        const text = await contentApi.getPrivacyPolicy();
        if (text && text.trim().length > 0) {
          setPolicyText(text);
        }
      } catch (err) {
        console.error('Failed to load privacy policy from backend:', err);
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
          <Shield size={15} />
          <span>Legal & Compliance</span>
        </div>
        <h1 className="legal-title">Privacy Policy, User Disclaimer & Terms of Use</h1>
        <div className="legal-date">Last Updated: August 2026 | Synchronized with Official Database</div>
      </div>

      <div className="legal-content-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            Loading live terms from server...
          </div>
        ) : (
          policyText
        )}
      </div>
    </div>
  );
}
