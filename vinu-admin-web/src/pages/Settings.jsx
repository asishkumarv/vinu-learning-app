import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { KeyRound, Eye, EyeOff, Shield, AlertTriangle, Globe } from 'lucide-react';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyMessage, setPolicyMessage] = useState(null);

  const [disclaimer, setDisclaimer] = useState('');
  const [disclaimerLoading, setDisclaimerLoading] = useState(false);
  const [disclaimerMessage, setDisclaimerMessage] = useState(null);

  const [websiteConfig, setWebsiteConfig] = useState({
    heroTagline: '',
    heroSubtitle: '',
    announcement: '',
    appDownloadUrl: '',
    playStoreUrl: '',
    supportEmail: '',
    supportPhone: ''
  });
  const [webConfigLoading, setWebConfigLoading] = useState(false);
  const [webConfigMessage, setWebConfigMessage] = useState(null);

  useEffect(() => {
    fetchPrivacyPolicy();
    fetchDisclaimer();
    fetchWebsiteConfig();
  }, []);

  const fetchPrivacyPolicy = async () => {
    try {
      const res = await axios.get('/admin/privacy-policy');
      setPrivacyPolicy(res.data.privacy_policy || '');
    } catch (error) {
      console.error('Failed to fetch privacy policy:', error);
    }
  };

  const fetchDisclaimer = async () => {
    try {
      const res = await axios.get('/admin/disclaimer');
      setDisclaimer(res.data.disclaimer || '');
    } catch (error) {
      console.error('Failed to fetch disclaimer:', error);
    }
  };

  const fetchWebsiteConfig = async () => {
    try {
      const res = await axios.get('/admin/website-config');
      if (res.data) {
        setWebsiteConfig({
          heroTagline: res.data.heroTagline || '',
          heroSubtitle: res.data.heroSubtitle || '',
          announcement: res.data.announcement || '',
          appDownloadUrl: res.data.appDownloadUrl || '',
          playStoreUrl: res.data.playStoreUrl || '',
          supportEmail: res.data.supportEmail || '',
          supportPhone: res.data.supportPhone || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch website config:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post('/admin/change-password', {
        currentPassword,
        newPassword
      });
      setMessage({ type: 'success', text: res.data.message || 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password change error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update password.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePolicySubmit = async (e) => {
    e.preventDefault();
    setPolicyLoading(true);
    setPolicyMessage(null);
    try {
      const res = await axios.put('/admin/privacy-policy', { privacy_policy: privacyPolicy });
      setPolicyMessage({ type: 'success', text: res.data.message || 'Privacy policy updated successfully!' });
    } catch (error) {
      console.error('Privacy policy update error:', error);
      setPolicyMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update privacy policy.'
      });
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleDisclaimerSubmit = async (e) => {
    e.preventDefault();
    setDisclaimerLoading(true);
    setDisclaimerMessage(null);
    try {
      const res = await axios.put('/admin/disclaimer', { disclaimer: disclaimer });
      setDisclaimerMessage({ type: 'success', text: res.data.message || 'Disclaimer updated successfully!' });
    } catch (error) {
      console.error('Disclaimer update error:', error);
      setDisclaimerMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update disclaimer.'
      });
    } finally {
      setDisclaimerLoading(false);
    }
  };

  const handleWebConfigSubmit = async (e) => {
    e.preventDefault();
    setWebConfigLoading(true);
    setWebConfigMessage(null);
    try {
      const res = await axios.put('/admin/website-config', websiteConfig);
      setWebConfigMessage({ type: 'success', text: res.data.message || 'Website settings updated successfully!' });
    } catch (error) {
      console.error('Website config update error:', error);
      setWebConfigMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update website settings.'
      });
    } finally {
      setWebConfigLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', paddingBottom: '3rem' }}>
      <h1 className="page-title">Settings & Content Management</h1>
      
      {/* 1. Website Settings Card */}
      <div className="stat-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Globe size={22} style={{ color: 'var(--primary-color)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Website Content & Links</h2>
        </div>

        {webConfigMessage && (
          <div style={{ 
            padding: '1rem', 
            marginBottom: '1.5rem', 
            borderRadius: '0.5rem',
            backgroundColor: webConfigMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: webConfigMessage.type === 'success' ? '#34d399' : '#f87171'
          }}>
            {webConfigMessage.text}
          </div>
        )}

        <form onSubmit={handleWebConfigSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label>Hero Headline / Tagline</label>
            <input 
              type="text" 
              value={websiteConfig.heroTagline} 
              onChange={e => setWebsiteConfig({ ...websiteConfig, heroTagline: e.target.value })} 
              placeholder="Listen & Learn — Smart Micro-Learning for AP & Telangana Students" 
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label>Hero Subtitle Description</label>
            <textarea 
              rows={3}
              value={websiteConfig.heroSubtitle} 
              onChange={e => setWebsiteConfig({ ...websiteConfig, heroSubtitle: e.target.value })} 
              placeholder="Transform your syllabus into engaging, bite-sized audio & video lessons..." 
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label>Top Announcement Bar Text</label>
            <input 
              type="text" 
              value={websiteConfig.announcement} 
              onChange={e => setWebsiteConfig({ ...websiteConfig, announcement: e.target.value })} 
              placeholder="🚀 New 10th Class Telugu & Intermediate Lessons Now Live on Vinuh App!" 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label>Direct App / APK Download URL</label>
              <input 
                type="url" 
                value={websiteConfig.appDownloadUrl} 
                onChange={e => setWebsiteConfig({ ...websiteConfig, appDownloadUrl: e.target.value })} 
                placeholder="https://vinuh.in/download" 
              />
            </div>
            <div className="form-group">
              <label>Google Play Store URL</label>
              <input 
                type="url" 
                value={websiteConfig.playStoreUrl} 
                onChange={e => setWebsiteConfig({ ...websiteConfig, playStoreUrl: e.target.value })} 
                placeholder="https://play.google.com/store/apps/details?id=..." 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>Support Email Address</label>
              <input 
                type="email" 
                value={websiteConfig.supportEmail} 
                onChange={e => setWebsiteConfig({ ...websiteConfig, supportEmail: e.target.value })} 
                placeholder="contact@vinuh.in" 
              />
            </div>
            <div className="form-group">
              <label>Support Phone / WhatsApp</label>
              <input 
                type="text" 
                value={websiteConfig.supportPhone} 
                onChange={e => setWebsiteConfig({ ...websiteConfig, supportPhone: e.target.value })} 
                placeholder="+91 98765 43210" 
              />
            </div>
          </div>

          <button type="submit" className="btn" disabled={webConfigLoading} style={{ width: '100%' }}>
            {webConfigLoading ? 'Saving Website Settings...' : 'Save Website Settings'}
          </button>
        </form>
      </div>

      {/* 2. Privacy Policy & Terms Card */}
      <div className="stat-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Shield size={22} style={{ color: 'var(--primary-color)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Edit Privacy Policy & Terms of Use</h2>
        </div>

        {policyMessage && (
          <div style={{ 
            padding: '1rem', 
            marginBottom: '1.5rem', 
            borderRadius: '0.5rem',
            backgroundColor: policyMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: policyMessage.type === 'success' ? '#34d399' : '#f87171'
          }}>
            {policyMessage.text}
          </div>
        )}

        <form onSubmit={handlePolicySubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Privacy Policy & Terms of Use Content (Live on App & Website)</label>
            <textarea
              value={privacyPolicy}
              onChange={e => setPrivacyPolicy(e.target.value)}
              required
              rows={15}
              placeholder="Enter Privacy Policy and Terms of Use text..."
              style={{
                resize: 'vertical',
                minHeight: '280px'
              }}
            />
          </div>

          <button type="submit" className="btn" disabled={policyLoading} style={{ width: '100%' }}>
            {policyLoading ? 'Saving changes...' : 'Save Privacy Policy & Terms'}
          </button>
        </form>
      </div>

      {/* 3. Disclaimer Card */}
      <div className="stat-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <AlertTriangle size={22} style={{ color: 'var(--primary-color)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Edit User Disclaimer</h2>
        </div>

        {disclaimerMessage && (
          <div style={{ 
            padding: '1rem', 
            marginBottom: '1.5rem', 
            borderRadius: '0.5rem',
            backgroundColor: disclaimerMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: disclaimerMessage.type === 'success' ? '#34d399' : '#f87171'
          }}>
            {disclaimerMessage.text}
          </div>
        )}

        <form onSubmit={handleDisclaimerSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Disclaimer Content (Live on App & Website)</label>
            <textarea
              value={disclaimer}
              onChange={e => setDisclaimer(e.target.value)}
              required
              rows={12}
              placeholder="Enter User Disclaimer text..."
              style={{
                resize: 'vertical',
                minHeight: '250px'
              }}
            />
          </div>

          <button type="submit" className="btn" disabled={disclaimerLoading} style={{ width: '100%' }}>
            {disclaimerLoading ? 'Saving changes...' : 'Save Disclaimer'}
          </button>
        </form>
      </div>

      {/* 4. Change Password Card */}
      <div className="stat-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <KeyRound size={22} className="text-primary" style={{ color: 'var(--primary-color)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Change Password</h2>
        </div>

        {message && (
          <div style={{ 
            padding: '1rem', 
            marginBottom: '1.5rem', 
            borderRadius: '0.5rem',
            backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: message.type === 'success' ? '#34d399' : '#f87171'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showCurrent ? "text" : "password"} 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
                required 
                placeholder="Enter current password" 
                style={{ paddingRight: '2.5rem' }}
              />
              <button 
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ 
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', 
                  background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showNew ? "text" : "password"} 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                required 
                placeholder="Enter new password" 
                style={{ paddingRight: '2.5rem' }}
              />
              <button 
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{ 
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', 
                  background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirm ? "text" : "password"} 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
                placeholder="Confirm new password" 
                style={{ paddingRight: '2.5rem' }}
              />
              <button 
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ 
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', 
                  background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Updating password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

