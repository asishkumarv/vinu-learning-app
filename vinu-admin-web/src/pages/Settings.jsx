import React, { useState } from 'react';
import axios from 'axios';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

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

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 className="page-title">Settings</h1>
      
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
