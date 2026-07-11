import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SearchableDropdown = ({ name, value, options, placeholder, onChange, required, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (optName) => {
    onChange({ target: { name, value: optName } });
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    onChange(e);
    setIsOpen(true);
  };

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          onFocus={() => { if (!disabled) setIsOpen(true); }}
          autoComplete="off"
          style={{ paddingRight: '2.5rem' }}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
          style={{
            position: 'absolute',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: disabled ? 'default' : 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            opacity: disabled ? 0.3 : 0.7
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: '105%',
          left: 0,
          right: 0,
          maxHeight: '200px',
          overflowY: 'auto',
          backgroundColor: '#151C2C',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '0.75rem',
          zIndex: 9999,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
          marginTop: '4px'
        }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectOption(opt)}
                style={{
                  padding: '0.75rem 1.25rem',
                  cursor: 'pointer',
                  color: '#F8FAFC',
                  fontSize: '0.95rem',
                  borderBottom: idx < filteredOptions.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(99, 102, 241, 0.15)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                {opt}
              </div>
            ))
          ) : (
            <div style={{ padding: '0.75rem 1.25rem', color: '#94A3B8', fontSize: '0.95rem', fontStyle: 'italic' }}>
              Create new: "{value}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
            <SearchableDropdown
              name="className"
              value={formData.className}
              options={getFilteredClasses().map(c => c.name)}
              placeholder="Select or type new..."
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Subject</label>
            <SearchableDropdown
              name="subjectName"
              value={formData.subjectName}
              options={getFilteredSubjects().map(s => s.name)}
              placeholder="Select or type new..."
              onChange={handleInputChange}
              required
              disabled={!formData.className}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Chapter</label>
            <SearchableDropdown
              name="chapterName"
              value={formData.chapterName}
              options={getFilteredChapters().map(c => c.name)}
              placeholder="Select or type new..."
              onChange={handleInputChange}
              required
              disabled={!formData.subjectName}
            />
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
