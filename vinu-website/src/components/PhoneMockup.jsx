import React, { useState } from 'react';
import { 
  Home, PlayCircle, Search, User, ChevronDown, Clock, TrendingUp, 
  Volume2, RotateCcw, Play, Pause, RotateCw, CheckCircle2, Moon, Bell, PlaySquare, Edit3, LogOut, Sun
} from 'lucide-react';

export default function PhoneMockup({ activeScreen = 0, onScreenChange }) {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <div className="mockup-wrapper">
      <div className="phone-mockup-frame">
        {/* Notch */}
        <div className="phone-notch"></div>

        {/* Dynamic Screen Content */}
        <div className="phone-screen">
          {/* Top Status Bar Mock */}
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            padding: '12px 18px 4px', fontSize: '11px', fontWeight: '600', color: '#94A3B8' 
          }}>
            <span>3:20</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span>5G</span>
              <span>85%</span>
            </div>
          </div>

          {/* SCREEN 0: HOME SCREEN */}
          {activeScreen === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '10px 14px' }}>
              {/* Header */}
              <div style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                background: 'linear-gradient(135deg, #0062FF 0%, #0084FF 100%)', 
                padding: '12px 14px', borderRadius: '18px', color: '#FFF', marginBottom: '12px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/newlogo1.png" alt="Vinuh" style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FFF' }} />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '0.5px' }}>VINUH</div>
                    <div style={{ fontSize: '10px', opacity: 0.9 }}>Listen & Learn</div>
                  </div>
                </div>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sun size={15} color="#FFF" />
                </div>
              </div>

              {/* Board Category Chips */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto' }}>
                <div style={{ padding: '6px 12px', background: '#0084FF', borderRadius: '10px', color: '#FFF', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#38BDF8', borderRadius: '2px' }}></span>
                  AP school
                </div>
                <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', color: '#94A3B8', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#F97316', borderRadius: '2px' }}></span>
                  Telangana
                </div>
                <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', color: '#94A3B8', fontSize: '11px', fontWeight: '600' }}>
                  Inter
                </div>
              </div>

              {/* Class Selectors Box */}
              <div style={{ background: '#0F172A', borderRadius: '16px', padding: '12px 14px', marginBottom: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px', fontWeight: '600' }}>Select Class</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', fontWeight: '600', color: '#E2E8F0' }}>
                  <span>AP 8th</span> <ChevronDown size={15} color="#94A3B8" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', fontWeight: '600', color: '#E2E8F0' }}>
                  <span>AP 9th</span> <ChevronDown size={15} color="#94A3B8" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', fontWeight: '700', color: '#38BDF8' }}>
                  <span>AP 10th (SSC)</span> <ChevronDown size={15} color="#38BDF8" />
                </div>
              </div>

              {/* Recent Releases Section */}
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#F8FAFC', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: '#38BDF8' }}>✨</span> Recent Releases
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                <div style={{ width: '130px', background: '#0F172A', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ height: '90px', background: 'linear-gradient(180deg, #78350F 0%, #1E1B4B 100%)', position: 'relative', padding: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '8px', background: 'rgba(0,0,0,0.6)', padding: '2px 4px', borderRadius: '4px', color: '#FDE047', alignSelf: 'flex-start' }}>Telugu</span>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#FFF' }}>10th Telugu ch2</span>
                  </div>
                  <div style={{ padding: '6px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#F8FAFC' }}>Lesson 2 Ep3</div>
                    <div style={{ fontSize: '8px', color: '#94A3B8' }}>By Dr. Vinuh</div>
                  </div>
                </div>

                <div style={{ width: '130px', background: '#0F172A', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ height: '90px', background: 'linear-gradient(180deg, #064E3B 0%, #0F172A 100%)', position: 'relative', padding: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '8px', background: 'rgba(0,0,0,0.6)', padding: '2px 4px', borderRadius: '4px', color: '#6EE7B7', alignSelf: 'flex-start' }}>Science</span>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#FFF' }}>10th Biology ch1</span>
                  </div>
                  <div style={{ padding: '6px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#F8FAFC' }}>Nutrition</div>
                    <div style={{ fontSize: '8px', color: '#94A3B8' }}>By Dr. Vinuh</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 1: SEARCH SCREEN */}
          {activeScreen === 1 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '12px 14px' }}>
              {/* Search Bar Input */}
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                background: '#1E293B', borderRadius: '14px', padding: '10px 14px', 
                color: '#94A3B8', fontSize: '12px', marginBottom: '16px' 
              }}>
                <Search size={16} color="#38BDF8" />
                <span>Search for chapters or subjects...</span>
              </div>

              {/* Recent Searches */}
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#F8FAFC', marginBottom: '10px' }}>Recent Searches</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
                <div style={{ padding: '6px 12px', background: 'rgba(30, 41, 59, 0.8)', borderRadius: '20px', color: '#94A3B8', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={11} /> Physics
                </div>
                <div style={{ padding: '6px 12px', background: 'rgba(30, 41, 59, 0.8)', borderRadius: '20px', color: '#94A3B8', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={11} /> Biology
                </div>
                <div style={{ padding: '6px 12px', background: 'rgba(30, 41, 59, 0.8)', borderRadius: '20px', color: '#94A3B8', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={11} /> Social Studies
                </div>
              </div>

              {/* Suggested Topics */}
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#F8FAFC', marginBottom: '8px' }}>Suggested Topics</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {['Biology', 'Social Science', 'Physics', 'English', 'Maths'].map((sub, i) => (
                  <div key={i} style={{ 
                    display: 'flex', alignItems: 'center', gap: '10px', 
                    padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', 
                    fontSize: '13px', fontWeight: '500', color: '#CBD5E1' 
                  }}>
                    <TrendingUp size={14} color="#0084FF" />
                    <span>{sub}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 2: VIDEO / REEL PLAYER */}
          {activeScreen === 2 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: '#020617', padding: '10px 12px' }}>
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', zIndex: 10 }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#F8FAFC' }}>10th Telugu ch2 ep3</div>
                  <div style={{ fontSize: '9px', color: '#94A3B8' }}>By Dr. Vinuh</div>
                </div>
                <CheckCircle2 size={16} color="#38BDF8" />
              </div>

              {/* Video Poster Art */}
              <div style={{ 
                flex: 1, borderRadius: '18px', overflow: 'hidden', position: 'relative', 
                background: 'linear-gradient(180deg, #451a03 0%, #172554 100%)', 
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#FDE047', fontWeight: '700', letterSpacing: '1px' }}>MANASA DEFENCE ACADEMY PRESENTS</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#FFF', lineHeight: 1.1, marginTop: '4px' }}>10th Class Telugu</div>
                  <div style={{ fontSize: '11px', color: '#E2E8F0', fontWeight: '700', marginTop: '2px' }}>LESSON 2: Chapter Episode 3</div>
                  <div style={{ fontSize: '8px', color: '#CBD5E1', fontStyle: 'italic' }}>A Basket of Life, Responsibilities & Hope</div>
                </div>

                {/* Big Center Play Icon */}
                <div style={{ alignSelf: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,132,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,132,255,0.6)' }}>
                  <Play size={22} color="#FFF" style={{ marginLeft: '3px' }} />
                </div>

                {/* Bottom Badges & Player Controls */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '8px', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px', color: '#FEF08A' }}>Values</span>
                    <span style={{ fontSize: '8px', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px', color: '#FEF08A' }}>Responsibility</span>
                    <span style={{ fontSize: '8px', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px', color: '#FEF08A' }}>Journey</span>
                    <span style={{ fontSize: '8px', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px', color: '#FEF08A' }}>Hope</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
                    <div style={{ width: '42%', height: '100%', background: '#0084FF' }}></div>
                  </div>

                  {/* Audio/Video Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFF' }}>
                    <Volume2 size={15} />
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <RotateCcw size={14} />
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0084FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Play size={13} color="#FFF" style={{ marginLeft: '2px' }} />
                      </div>
                      <RotateCw size={14} />
                    </div>
                    <span style={{ fontSize: '9px', opacity: 0.8 }}>01:48</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 3: ACCOUNT & PROFILE */}
          {activeScreen === 3 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '12px 14px' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#F8FAFC', marginBottom: '14px' }}>Account</div>
              
              {/* Profile Avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#0F172A', border: '3px solid #0084FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <User size={30} color="#0084FF" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#FFF' }}>Asish</span>
                  <Edit3 size={13} color="#94A3B8" />
                </div>
                <div style={{ padding: '2px 8px', background: '#1E293B', borderRadius: '12px', color: '#38BDF8', fontSize: '9px', fontWeight: '700', marginTop: '4px' }}>
                  10th Grade
                </div>
              </div>

              {/* Learning Progress Box */}
              <div style={{ background: '#0F172A', borderRadius: '16px', padding: '12px', marginBottom: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Learning Progress</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0084FF' }}>5</div>
                    <div style={{ fontSize: '9px', color: '#94A3B8' }}>Videos Watched</div>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#38BDF8' }}>0</div>
                    <div style={{ fontSize: '9px', color: '#94A3B8' }}>Quizzes Done</div>
                  </div>
                </div>
              </div>

              {/* Preferences Box */}
              <div style={{ background: '#0F172A', borderRadius: '16px', padding: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>Preferences</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#E2E8F0' }}>
                    <Moon size={14} color="#0084FF" />
                    <span>Dark Mode</span>
                  </div>
                  <div style={{ width: '28px', height: '16px', background: '#0084FF', borderRadius: '10px', position: 'relative' }}>
                    <div style={{ width: '12px', height: '12px', background: '#FFF', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#E2E8F0' }}>
                    <Bell size={14} color="#0084FF" />
                    <span>Push Notifications</span>
                  </div>
                  <div style={{ width: '28px', height: '16px', background: '#0084FF', borderRadius: '10px', position: 'relative' }}>
                    <div style={{ width: '12px', height: '12px', background: '#FFF', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#E2E8F0' }}>
                    <PlaySquare size={14} color="#0084FF" />
                    <span>Auto-play Videos</span>
                  </div>
                  <div style={{ width: '28px', height: '16px', background: '#0084FF', borderRadius: '10px', position: 'relative' }}>
                    <div style={{ width: '12px', height: '12px', background: '#FFF', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom App Navigation Bar */}
          <div style={{ 
            display: 'flex', justifyContent: 'space-around', alignItems: 'center', 
            background: '#080E1A', borderTop: '1px solid rgba(255,255,255,0.08)', 
            padding: '10px 0 6px' 
          }}>
            <div onClick={() => onScreenChange && onScreenChange(0)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
              <Home size={16} color={activeScreen === 0 ? '#0084FF' : '#64748B'} />
              <span style={{ fontSize: '9px', color: activeScreen === 0 ? '#0084FF' : '#64748B', fontWeight: '600' }}>Home</span>
            </div>
            <div onClick={() => onScreenChange && onScreenChange(2)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
              <PlayCircle size={16} color={activeScreen === 2 ? '#0084FF' : '#64748B'} />
              <span style={{ fontSize: '9px', color: activeScreen === 2 ? '#0084FF' : '#64748B', fontWeight: '600' }}>Videos</span>
            </div>
            <div onClick={() => onScreenChange && onScreenChange(1)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
              <Search size={16} color={activeScreen === 1 ? '#0084FF' : '#64748B'} />
              <span style={{ fontSize: '9px', color: activeScreen === 1 ? '#0084FF' : '#64748B', fontWeight: '600' }}>Search</span>
            </div>
            <div onClick={() => onScreenChange && onScreenChange(3)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
              <User size={16} color={activeScreen === 3 ? '#0084FF' : '#64748B'} />
              <span style={{ fontSize: '9px', color: activeScreen === 3 ? '#0084FF' : '#64748B', fontWeight: '600' }}>Profile</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
