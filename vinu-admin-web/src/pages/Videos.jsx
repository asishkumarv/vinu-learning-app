import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit2, Trash2, X } from 'lucide-react';

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState({ classes: [], subjects: [], chapters: [] });
  const [loading, setLoading] = useState(true);
  
  const [editingVideo, setEditingVideo] = useState(null);
  const [formData, setFormData] = useState({
    sectionName: 'AP school',
    className: '',
    subjectName: '',
    chapterName: '',
    title: '',
    is_free: false,
    videoFile: null
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchVideos();
    fetchCategories();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await axios.get('/admin/videos');
      setVideos(res.data);
    } catch (error) {
      console.error('Failed to fetch videos', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/admin/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`/admin/videos/${id}`);
      setVideos(videos.filter(v => v.id !== id));
      setMessage({ type: 'success', text: 'Video deleted successfully!' });
    } catch (error) {
      console.error('Failed to delete video', error);
      setMessage({ type: 'error', text: 'Failed to delete video.' });
    }
  };

  const handleEditClick = (video) => {
    setEditingVideo(video);
    setFormData({
      sectionName: video.section_name || 'AP school',
      className: video.class_name || '',
      subjectName: video.subject_name || '',
      chapterName: video.chapter_name || '',
      title: video.title || '',
      is_free: video.is_free || false,
      videoFile: null
    });
    setMessage(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => {
      let updates = { [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value };
      
      // Cascade clearing
      if (name === 'sectionName') {
         updates.className = '';
         updates.subjectName = '';
         updates.chapterName = '';
      }
      if (name === 'className') {
         updates.subjectName = '';
         updates.chapterName = '';
      }
      if (name === 'subjectName') {
         updates.chapterName = '';
      }
      
      return { ...prev, ...updates };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const data = new FormData();
    data.append('sectionName', formData.sectionName);
    data.append('className', formData.className);
    data.append('subjectName', formData.subjectName);
    data.append('chapterName', formData.chapterName);
    data.append('title', formData.title);
    data.append('is_free', formData.is_free);
    if (formData.videoFile) {
      data.append('video', formData.videoFile);
    }

    try {
      await axios.put(`/admin/videos/${editingVideo.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: 'Video updated successfully!' });
      setEditingVideo(null);
      fetchVideos(); // Refresh list
    } catch (error) {
      console.error('Update error', error);
      setMessage({ type: 'error', text: 'Failed to update video.' });
    } finally {
      setSaving(false);
    }
  };

  // Cascading Logic
  const getFilteredClasses = () => {
    return categories.classes.filter(c => c.section === formData.sectionName);
  };
  const getFilteredSubjects = () => {
    const classObj = getFilteredClasses().find(c => c.name === formData.className);
    if (!classObj) return [];
    return categories.subjects.filter(s => s.class_id === classObj.id);
  };
  const getFilteredChapters = () => {
    const subjectObj = getFilteredSubjects().find(s => s.name === formData.subjectName);
    if (!subjectObj) return [];
    return categories.chapters.filter(ch => ch.subject_id === subjectObj.id);
  };

  if (loading) return <div>Loading videos...</div>;

  return (
    <div>
      <h1 className="page-title">Videos Management</h1>

      {message && !editingVideo && (
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

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Class</th>
              <th>Subject</th>
              <th>Chapter</th>
              <th>Duration</th>
              <th>Access</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id}>
                <td style={{ fontWeight: '500' }}>{video.title}</td>
                <td>{video.class_name}</td>
                <td>{video.subject_name}</td>
                <td>{video.chapter_name}</td>
                <td>{video.duration ? `${Math.floor(video.duration / 60)}m ${video.duration % 60}s` : '-'}</td>
                <td>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '0.5rem', 
                    fontSize: '0.75rem',
                    backgroundColor: video.is_free ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: video.is_free ? '#34d399' : '#fbbf24'
                  }}>
                    {video.is_free ? 'Free' : 'Premium'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleEditClick(video)}
                      style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer' }}
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(video.id)}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {videos.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>No videos found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingVideo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(10, 15, 28, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="stat-card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              onClick={() => setEditingVideo(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Edit Video</h2>
            
            {message && (
              <div style={{ 
                padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem',
                backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: message.type === 'success' ? '#34d399' : '#f87171'
              }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Episode Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Section</label>
                <select name="sectionName" value={formData.sectionName} onChange={handleInputChange} required>
                  <option value="AP school">AP School</option>
                  <option value="Telangana school">Telangana School</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Life Skills">Life Skills</option>
                </select>
              </div>

              <div className="form-group">
                <label>Class / Section</label>
                <input type="text" name="className" list="classes-edit" value={formData.className} onChange={handleInputChange} autoComplete="off" required placeholder="Select or type new..." />
                <datalist id="classes-edit">{getFilteredClasses().map(c => <option key={c.id} value={c.name} />)}</datalist>
              </div>

              <div className="form-group">
                <label>Subject</label>
                <input type="text" name="subjectName" list="subjects-edit" value={formData.subjectName} onChange={handleInputChange} autoComplete="off" required disabled={!formData.className} placeholder="Select or type new..." />
                <datalist id="subjects-edit">{getFilteredSubjects().map(s => <option key={s.id} value={s.name} />)}</datalist>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Chapter</label>
                <input type="text" name="chapterName" list="chapters-edit" value={formData.chapterName} onChange={handleInputChange} autoComplete="off" required disabled={!formData.subjectName} placeholder="Select or type new..." />
                <datalist id="chapters-edit">{getFilteredChapters().map(c => <option key={c.id} value={c.name} />)}</datalist>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="checkbox-label">
                  <input type="checkbox" name="is_free" checked={formData.is_free} onChange={handleInputChange} />
                  Is this video free for all users?
                </label>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '0.5rem' }}>
                <label style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>Replace Video File (Optional)</label>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Leave this blank if you only want to update the details above. If you select a file, the old video will be deleted from Cloudinary.
                </p>
                <input type="file" name="videoFile" accept="video/*" onChange={handleInputChange} style={{ background: 'transparent', padding: 0 }} />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditingVideo(null)} className="btn" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
