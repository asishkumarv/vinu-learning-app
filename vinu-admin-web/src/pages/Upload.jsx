import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UploadPage() {
  const [categories, setCategories] = useState({ classes: [], subjects: [], chapters: [] });
  const [formData, setFormData] = useState({
    className: '',
    subjectName: '',
    chapterName: '',
    title: '',
    is_free: true,
    video: null
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/admin/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.video) {
      setMessage({ type: 'error', text: 'Please select a video file.' });
      return;
    }

    setUploading(true);
    setProgress(0);
    setMessage(null);

    const data = new FormData();
    data.append('className', formData.className);
    data.append('subjectName', formData.subjectName);
    data.append('chapterName', formData.chapterName);
    data.append('title', formData.title);
    data.append('is_free', formData.is_free);
    data.append('video', formData.video);

    try {
      await axios.post('/admin/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      setMessage({ type: 'success', text: 'Video uploaded and compressed successfully!' });
      setFormData({ ...formData, title: '', video: null });
      document.getElementById('videoFile').value = '';
      fetchCategories(); // Refresh categories
    } catch (error) {
      console.error('Upload error', error);
      setMessage({ type: 'error', text: 'Failed to upload video.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 className="page-title">Upload Video</h1>

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

      <form onSubmit={handleSubmit} className="table-container" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label>Class / Section</label>
            <input 
              type="text" 
              name="className" 
              list="classes"
              value={formData.className} 
              onChange={handleInputChange} 
              required 
              placeholder="e.g. Class 10"
            />
            <datalist id="classes">
              {categories.classes.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
          </div>

          <div className="form-group">
            <label>Subject</label>
            <input 
              type="text" 
              name="subjectName" 
              list="subjects"
              value={formData.subjectName} 
              onChange={handleInputChange} 
              required 
              placeholder="e.g. Mathematics"
            />
            <datalist id="subjects">
              {categories.subjects.map(s => <option key={s.id} value={s.name} />)}
            </datalist>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Chapter</label>
            <input 
              type="text" 
              name="chapterName" 
              list="chapters"
              value={formData.chapterName} 
              onChange={handleInputChange} 
              required 
              placeholder="e.g. Algebra Basics"
            />
            <datalist id="chapters">
              {categories.chapters.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Episode Title</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleInputChange} 
              required 
              placeholder="e.g. Introduction to Variables"
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                name="is_free" 
                checked={formData.is_free} 
                onChange={handleInputChange} 
              />
              Is this video free for all users?
            </label>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Video File</label>
            <input 
              type="file" 
              id="videoFile"
              name="video" 
              accept="video/*" 
              onChange={handleInputChange} 
              required 
              style={{ padding: '0.5rem 0' }}
            />
          </div>

        </div>

        <button type="submit" className="btn" disabled={uploading} style={{ width: '100%', marginTop: '1rem' }}>
          {uploading ? 'Uploading & Compressing...' : 'Upload Video'}
        </button>

        {uploading && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </form>
    </div>
  );
}
