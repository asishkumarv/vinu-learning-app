import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/admin/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;
  if (!stats) return <div>Error loading stats</div>;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Users</div>
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {stats.usersCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Videos</div>
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {stats.videosCount}
          </div>
        </div>
      </div>

      <div className="table-container">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Recent Uploads</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Chapter</th>
              <th>Upload Date</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentUploads.map((video) => (
              <tr key={video.id}>
                <td style={{ fontWeight: '500' }}>{video.title}</td>
                <td>{video.chapter_name || '-'}</td>
                <td>{new Date(video.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {stats.recentUploads.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center' }}>No recent uploads found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
