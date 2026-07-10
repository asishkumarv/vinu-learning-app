import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UploadPage() {
  const [categories, setCategories] = useState({ classes: [], subjects: [], chapters: [] });
  const [formData, setFormData] = useState({
    sectionName: 'AP school',
    className: '',
    subjectName: '',
    chapterName: '',
    title: '',
    is_free: false,
    videoFile: null
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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.videoFile) {
      setMessage({ type: 'error', text: 'Please select a video file.' });
      return;
    }

    setUploading(true);
    setProgress(0);
    setMessage(null);

    const data = new FormData();
    data.append('sectionName', formData.sectionName);
    data.append('className', formData.className);
    data.append('subjectName', formData.subjectName);
    data.append('chapterName', formData.chapterName);
    data.append('title', formData.title);
    data.append('is_free', formData.is_free);
    data.append('video', formData.videoFile);

    try {
      await axios.post('/admin/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      setMessage({ type: 'success', text: 'Video uploaded and compressed successfully!' });
      setFormData({ sectionName: 'AP school', className: '', subjectName: '', chapterName: '', title: '', is_free: false, videoFile: null });
      fetchCategories(); // Refresh options
    } catch (error) {
      console.error('Upload error', error);
      setMessage({ type: 'error', text: 'Failed to upload video.' });
    } finally {
      setUploading(false);
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

  return (
    <div className="upload-container">
      <h1 className="page-title">Upload New Video</h1>
      <div className="stat-card" style={{ maxWidth: '800px' }}>
        {message && (
          <div style={{ 
            padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem',
            backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: message.type === 'success' ? '#34d399' : '#f87171'
          }}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          
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
            <input type="text" name="className" list="classes-list" placeholder="Select or type new..." value={formData.className} onChange={handleInputChange} autoComplete="off" required />
            <datalist id="classes-list">
              {getFilteredClasses().map(c => <option key={c.id} value={c.name} />)}
            </datalist>
          </div>

          <div className="form-group">
            <label>Subject</label>
            <input type="text" name="subjectName" list="subjects-list" placeholder="Select or type new..." value={formData.subjectName} onChange={handleInputChange} autoComplete="off" required disabled={!formData.className} />
            <datalist id="subjects-list">
              {getFilteredSubjects().map(s => <option key={s.id} value={s.name} />)}
            </datalist>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Chapter</label>
            <input type="text" name="chapterName" list="chapters-list" placeholder="Select or type new..." value={formData.chapterName} onChange={handleInputChange} autoComplete="off" required disabled={!formData.subjectName} />
            <datalist id="chapters-list">
              {getFilteredChapters().map(c => <option key={c.id} value={c.name} />)}
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
              name="videoFile" 
              accept="video/*" 
              onChange={handleInputChange} 
              required 
              style={{ padding: '0.5rem 0' }}
            />
          </div>

        <button type="submit" className="btn" disabled={uploading} style={{ width: '100%', marginTop: '1rem', gridColumn: '1 / -1' }}>
          {uploading ? 'Uploading & Compressing...' : 'Upload Video'}
        </button>

        {uploading && (
          <div className="progress-bar" style={{ gridColumn: '1 / -1' }}>
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        )}
        </form>
      </div>
    </div>
  );
}
