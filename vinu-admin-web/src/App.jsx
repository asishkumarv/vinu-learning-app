import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Upload, LogOut, Video, Eye, EyeOff } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/Users';
import UploadPage from './pages/Upload';
import VideosPage from './pages/Videos';
import axios from 'axios';

axios.defaults.baseURL = 'https://api.vinuh.in/api';

const savedToken = localStorage.getItem('adminToken');
if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

function Sidebar({ onLogout }) {
  return (
    <div className="sidebar">
      <div className="sidebar-title">Vinuh Admin</div>
      <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
        <LayoutDashboard size={20} />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/users" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
        <Users size={20} />
        <span>Users</span>
      </NavLink>
      <NavLink to="/videos" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
        <Video size={20} />
        <span>Videos</span>
      </NavLink>
      <NavLink to="/upload" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
        <Upload size={20} />
        <span>Upload Video</span>
      </NavLink>
      
      <div style={{ marginTop: 'auto' }}>
        <button onClick={onLogout} className="nav-link" style={{ background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--danger-color)' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post('/auth/admin-login', { email, password });
      if (res.data.token) {
        onLogin(res.data.token);
      } else {
        setError('Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <div className="stat-card" style={{ width: '420px', padding: '2.5rem 2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Sign in to Vinuh Admin Panel</p>
          </div>
          
          {error && (
            <div style={{ 
              color: 'var(--danger-color)', 
              backgroundColor: 'var(--danger-light)',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem', 
              textAlign: 'center',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@vinuh.com" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  placeholder="••••••••" 
                  style={{ paddingRight: '2.5rem' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', 
                    background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('adminToken', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('adminToken');
    }
  }, [token]);

  const handleLogout = () => {
    setToken(null);
  };

  if (!token) {
    return <Login onLogin={setToken} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar onLogout={handleLogout} />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/upload" element={<UploadPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
