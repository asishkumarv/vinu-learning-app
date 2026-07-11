import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Edit2, Trash2, X } from 'lucide-react';

const SearchableDropdown = ({ name, value, options, placeholder, onChange, required, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

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

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState({ classes: [], subjects: [], chapters: [] });
  const [loading, setLoading] = useState(true);
  
  // Tab/Hierarchical state selectors
  const [selectedSection, setSelectedSection] = useState('AP school');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  // Inline edit state
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editingChapterName, setEditingChapterName] = useState('');

  // Video edit modal state
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

  // Cascading states for default selection
  useEffect(() => {
    const filteredClasses = categories.classes.filter(c => c.section === selectedSection);
    if (filteredClasses.length > 0) {
      setSelectedClassId(filteredClasses[0].id);
    } else {
      setSelectedClassId(null);
      setSelectedSubjectId(null);
    }
  }, [selectedSection, categories.classes]);

  useEffect(() => {
    if (selectedClassId) {
      const filteredSubjects = categories.subjects.filter(s => s.class_id === selectedClassId);
      if (filteredSubjects.length > 0) {
        setSelectedSubjectId(filteredSubjects[0].id);
      } else {
        setSelectedSubjectId(null);
      }
    } else {
      setSelectedSubjectId(null);
    }
  }, [selectedClassId, categories.subjects]);

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

  const handleDeleteVideo = async (id) => {
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

  const handleRenameSubject = async (subjectId) => {
    if (!editingSubjectName.trim()) return;
    try {
      await axios.put(`/admin/subjects/${subjectId}`, { name: editingSubjectName });
      setEditingSubjectId(null);
      fetchCategories();
      fetchVideos();
      setMessage({ type: 'success', text: 'Subject renamed successfully!' });
    } catch (e) {
      console.error(e);
      alert('Failed to rename subject');
    }
  };

  const handleRenameChapter = async (chapterId) => {
    if (!editingChapterName.trim()) return;
    try {
      await axios.put(`/admin/chapters/${chapterId}`, { name: editingChapterName });
      setEditingChapterId(null);
      fetchCategories();
      fetchVideos();
      setMessage({ type: 'success', text: 'Chapter renamed successfully!' });
    } catch (e) {
      console.error(e);
      alert('Failed to rename chapter');
    }
  };

  const handleDeleteChapter = async (chapterId, chapterName) => {
    if (!window.confirm(`Are you sure you want to delete chapter "${chapterName}" and ALL of its associated videos? This action cannot be undone.`)) return;
    
    try {
      await axios.delete(`/admin/chapters/${chapterId}`);
      fetchCategories();
      fetchVideos();
      setMessage({ type: 'success', text: `Chapter "${chapterName}" and all its videos deleted successfully!` });
    } catch (e) {
      console.error(e);
      alert('Failed to delete chapter');
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

  const handleSaveVideo = async (e) => {
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
      fetchVideos();
      fetchCategories();
    } catch (error) {
      console.error('Update error', error);
      setMessage({ type: 'error', text: 'Failed to update video.' });
    } finally {
      setSaving(false);
    }
  };

  // Cascading Logic for Edit Modal
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

  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '2rem' }}>Loading videos...</div>;

  const sections = ['AP school', 'Telangana school', 'Intermediate', 'Life Skills'];
  const activeClasses = categories.classes.filter(c => c.section === selectedSection);
  const activeSubjects = selectedClassId 
    ? categories.subjects.filter(s => s.class_id === selectedClassId) 
    : [];
  
  const activeSubject = categories.subjects.find(s => s.id === selectedSubjectId);
  const activeChapters = selectedSubjectId
    ? categories.chapters.filter(ch => ch.subject_id === selectedSubjectId)
    : [];

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

      {/* SECTION TABS */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
        {sections.map(sec => (
          <button 
            key={sec}
            onClick={() => setSelectedSection(sec)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem 1rem',
              color: selectedSection === sec ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderBottom: selectedSection === sec ? '3px solid var(--primary-color)' : '3px solid transparent',
              fontWeight: selectedSection === sec ? '600' : '400',
              cursor: 'pointer',
              fontSize: '1.05rem',
              transition: 'all 0.2s'
            }}
          >
            {sec === 'AP school' ? 'AP School' : sec === 'Telangana school' ? 'Telangana School' : sec}
          </button>
        ))}
      </div>

      {/* CLASS PILLS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {activeClasses.map(cls => (
          <button
            key={cls.id}
            onClick={() => setSelectedClassId(cls.id)}
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '0.4rem 1.1rem',
              backgroundColor: selectedClassId === cls.id ? 'var(--primary-color)' : 'rgba(255,255,255,0.02)',
              color: selectedClassId === cls.id ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              fontWeight: selectedClassId === cls.id ? '600' : '400'
            }}
          >
            {cls.name}
          </button>
        ))}
        {activeClasses.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>No classes found in this section.</div>
        )}
      </div>

      {/* SUBJECT CARDS/TABS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
        {activeSubjects.map(sub => (
          <button
            key={sub.id}
            onClick={() => setSelectedSubjectId(sub.id)}
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.6rem 1.25rem',
              backgroundColor: selectedSubjectId === sub.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.3)',
              borderColor: selectedSubjectId === sub.id ? 'var(--primary-color)' : 'var(--border-color)',
              color: selectedSubjectId === sub.id ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            {sub.name}
          </button>
        ))}
        {activeClasses.length > 0 && activeSubjects.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>No subjects found in this class.</div>
        )}
      </div>

      {/* RENAME ACTIVE SUBJECT CONTAINER */}
      {activeSubject && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem', 
          paddingBottom: '0.75rem', 
          borderBottom: '1px solid rgba(255,255,255,0.06)' 
        }}>
          {editingSubjectId === activeSubject.id ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="text" 
                value={editingSubjectName} 
                onChange={(e) => setEditingSubjectName(e.target.value)} 
                style={{ padding: '0.4rem 0.8rem', fontSize: '1rem', width: '250px' }} 
              />
              <button onClick={() => handleRenameSubject(activeSubject.id)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Save</button>
              <button onClick={() => setEditingSubjectId(null)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '600' }}>Subject: <span style={{ color: 'var(--primary-color)' }}>{activeSubject.name}</span></h2>
              <button 
                onClick={() => { setEditingSubjectId(activeSubject.id); setEditingSubjectName(activeSubject.name); }}
                style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0 }}
                title="Rename Subject"
              >
                <Edit2 size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* CHAPTER CARDS AND VIDEOS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {activeChapters.map(chapter => {
          const chapterVideos = videos.filter(v => v.chapter_id === chapter.id);
          
          return (
            <div key={chapter.id} className="stat-card" style={{ padding: '1.5rem', backgroundColor: 'var(--surface-solid)' }}>
              
              {/* CHAPTER HEADER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                {editingChapterId === chapter.id ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      value={editingChapterName} 
                      onChange={(e) => setEditingChapterName(e.target.value)} 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.95rem', width: '220px' }} 
                    />
                    <button onClick={() => handleRenameChapter(chapter.id)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Save</button>
                    <button onClick={() => setEditingChapterId(null)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#F8FAFC' }}>{chapter.name}</h3>
                    <button 
                      onClick={() => { setEditingChapterId(chapter.id); setEditingChapterName(chapter.name); }}
                      style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0 }}
                      title="Rename Chapter"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
                
                <button 
                  onClick={() => handleDeleteChapter(chapter.id, chapter.name)}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Delete Entire Chapter"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* CHAPTER VIDEOS LIST */}
              <div className="table-container" style={{ backdropFilter: 'none', border: '1px solid rgba(255,255,255,0.04)' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.75rem 1rem' }}>Title</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Duration</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Access</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapterVideos.map(video => (
                      <tr key={video.id}>
                        <td style={{ fontWeight: '500', padding: '0.75rem 1rem' }}>{video.title}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{video.duration ? `${Math.floor(video.duration / 60)}m ${video.duration % 60}s` : '-'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '0.5rem', 
                            fontSize: '0.75rem',
                            backgroundColor: video.is_free ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: video.is_free ? '#34d399' : '#fbbf24'
                          }}>
                            {video.is_free ? 'Free' : 'Premium'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleEditClick(video)}
                              style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer' }}
                              title="Edit Video"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteVideo(video.id)}
                              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                              title="Delete Video"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {chapterVideos.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem' }}>
                          No videos in this chapter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        {selectedSubjectId && activeChapters.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>No chapters found in this subject.</div>
        )}
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

            <form onSubmit={handleSaveVideo} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
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
                <label className="checkbox-label">
                  <input type="checkbox" name="is_free" checked={formData.is_free} onChange={handleInputChange} />
                  Is this video free for all users?
                </label>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '0.5rem' }}>
                <label style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>Replace Video File (Optional)</label>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Leave this blank if you only want to update the details above. If you select a file, the old video will be deleted.
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
