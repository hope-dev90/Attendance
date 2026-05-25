import { useState, useEffect } from 'react';
import {
  User, CheckCircle, AlertCircle, Calendar,
  ArrowLeft, LayoutDashboard, Clock, Send, CheckCircle2,
  LogOut, BookOpen, History, Menu, X, ClipboardList, Bell,
} from 'lucide-react';
import timetableData from '../data/timetable.json';
import { api } from '../api';
import LogoImg from '../assets/logo.jpg';
import NotificationSettings, { notify } from './NotificationSettings';
import useNotifications from '../hooks/useNotifications';

const NAVY    = '#2e5a88';
const NAVY_DK = '#1e3f63';
const SLATE_BG = '#f4f6f9';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'lessons',   label: 'Lesson Tracking', icon: BookOpen },
  { id: 'history',   label: 'History',         icon: History },
];

const getCurrentTimeStr = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
};

const isOngoing = (slot) => {
  const t = getCurrentTimeStr();
  const [start, end] = slot.split('-');
  return t >= start && t <= end;
};

const getTodayLessons = (timetable, monitorClass) => {
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayData = timetable.find(d => d.day === dayName);
  if (!todayData) return [];
  return Object.entries(todayData.schedule)
    .map(([slot, classes]) => {
      const lesson = classes[monitorClass];
      if (!lesson) return null;
      return { timeSlot: slot, ...lesson, ongoing: isOngoing(slot) };
    })
    .filter(Boolean)
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
};

const todayFull = new Date().toLocaleDateString('en-GB', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});
const dayName  = new Date().toLocaleDateString('en-US', { weekday: 'long' });
const todayISO = new Date().toISOString().split('T')[0];

const Sidebar = ({ activePage, onNavigate, onBack, onLogout, mobileOpen, onMobileClose }) => (
  <aside className={`sn-sidebar ${mobileOpen ? 'sn-sidebar-open' : ''}`}>
    <div className="sn-sidebar-logo">
      <div className="sn-logo-icon">
        <img src={LogoImg} alt="logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
      </div>
      <div className="sn-logo-text"><h1>StaffNet</h1><p>Lesson Section</p></div>
      <button className="sn-mobile-close" onClick={onMobileClose}><X size={18} /></button>
    </div>
    <nav className="sn-sidebar-nav">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button key={id} className={`sn-nav-item ${activePage === id ? 'sn-nav-active' : ''}`}
          onClick={() => { onNavigate(id); onMobileClose(); }}>
          <Icon size={18} />{label}
        </button>
      ))}
    </nav>
    <div className="sn-sidebar-footer">
      <button className="sn-footer-btn sn-footer-back" onClick={onBack}><ArrowLeft size={16} /> Back</button>
      <button className="sn-footer-btn sn-footer-logout" onClick={onLogout}><LogOut size={16} /> Logout</button>
    </div>
  </aside>
);

const PlaceholderPage = ({ title, icon: Icon }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:16 }}>
    <div style={{ width:72, height:72, borderRadius:'50%', background:'#eff6ff', color:NAVY, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Icon size={32} />
    </div>
    <p style={{ fontSize:22, fontWeight:900, color:'#1e293b' }}>{title}</p>
    <p style={{ fontSize:14, color:'#94a3b8', fontWeight:600 }}>This section is coming soon.</p>
  </div>
);

/* ── Lesson History Page ── */
const LessonHistoryPage = ({ monitorClass }) => {
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.getLessonReports()
      .then(setReports)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (iso) => new Date(iso).toLocaleDateString('en-GB', {
    weekday:'short', day:'numeric', month:'short', year:'numeric',
  });

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
      <div style={{ width:28, height:28, border:`3px solid #e2e8f0`, borderTopColor:NAVY, borderRadius:'50%', animation:'snSpin .7s linear infinite' }} />
    </div>
  );

  if (reports.length === 0) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'50vh', gap:12 }}>
      <div style={{ width:64, height:64, borderRadius:'50%', background:'#f1f5f9', color:'#cbd5e1', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <History size={28} />
      </div>
      <p style={{ fontWeight:900, fontSize:17, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em' }}>No History Yet</p>
      <p style={{ fontSize:13, color:'#94a3b8' }}>Submitted lesson reports will appear here.</p>
    </div>
  );

  return (
    <div style={{ animation:'snFadeIn .25s ease' }}>
      <div className="sn-page-header">
        <div>
          <h1 className="sn-page-title">Lesson History</h1>
          <p className="sn-page-sub">Class {monitorClass} — {reports.length} report{reports.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="sn-card" style={{ overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 22px', borderBottom:'1px solid #f1f5f9' }}>
          <p style={{ fontWeight:900, fontSize:15, color:'#1e293b' }}>Submitted Reports</p>
        </div>

        {reports.map((r) => {
          const lessons = Array.isArray(r.lessons) ? r.lessons : JSON.parse(r.lessons || '[]');
          const presentCount = lessons.filter(l => l.teacherPresent === true).length;
          const absentCount  = lessons.filter(l => l.teacherPresent === false).length;
          const isOpen = expanded === r.id;

          return (
            <div key={r.id} style={{ borderBottom:'1px solid #f8fafc' }}>
              {/* Row */}
              <div
                onClick={() => setExpanded(isOpen ? null : r.id)}
                style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:12, padding:'14px 22px', cursor:'pointer', transition:'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background='#fafbfc'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <div style={{ flex:1, minWidth:140 }}>
                  <p style={{ fontWeight:800, color:'#1e293b', fontSize:14 }}>{fmt(r.report_date)}</p>
                  <p style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginTop:2 }}>
                    {new Date(r.submitted_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <span style={{ background:'#ecfdf5', color:'#10b981', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:800 }}>
                    ✓ {presentCount} Present
                  </span>
                  <span style={{ background:'#fff1f2', color:'#ef4444', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:800 }}>
                    ✗ {absentCount} Absent
                  </span>
                  <span style={{ background:'#f1f5f9', color:'#64748b', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:800 }}>
                    {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <span style={{ color:'#94a3b8', fontSize:12 }}>{isOpen ? '▲' : '▼'}</span>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ background:'#fafbfc', borderTop:'1px solid #f1f5f9' }}>
                  {/* Column headers */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 100px', padding:'8px 22px', borderBottom:'1px solid #f1f5f9' }}>
                    {['Time Slot','Subject / Teacher','Status'].map(h => (
                      <p key={h} style={{ fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em', color:'#94a3b8' }}>{h}</p>
                    ))}
                  </div>
                  {lessons.map((l, i) => (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 100px', padding:'11px 22px', borderBottom:'1px solid #f8fafc', alignItems:'center' }}>
                      <p style={{ fontSize:13, fontWeight:700, color:'#475569' }}>{l.timeSlot}</p>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:'#1e293b' }}>{l.subject}</p>
                        <p style={{ fontSize:11, color:'#94a3b8' }}>{l.teacher}</p>
                      </div>
                      <span style={{
                        display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:800,
                        background: l.teacherPresent === true ? '#ecfdf5' : l.teacherPresent === false ? '#fff1f2' : '#f1f5f9',
                        color:      l.teacherPresent === true ? '#10b981' : l.teacherPresent === false ? '#ef4444' : '#94a3b8',
                      }}>
                        {l.teacherPresent === true ? '✓ Present' : l.teacherPresent === false ? '✗ Absent' : '— N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LessonTrackingPage = ({ monitorClass = 'Y3A' }) => {
  const [lessons,       setLessons]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [teacherStatus, setTeacherStatus] = useState({});
  const [lockedSlots,   setLockedSlots]   = useState(new Set()); // once marked, locked
  const [submitting,    setSubmitting]    = useState(false);
  const [submittedSlots,setSubmittedSlots]= useState(new Set()); // track submitted lessons
  const [submitted,     setSubmitted]     = useState(false);
  const [message,       setMessage]       = useState('');
  const [showNotifSettings, setShowNotifSettings] = useState(false);

  useNotifications(lessons, teacherStatus, submitted);

  useEffect(() => {
    const update = () => { setLessons(getTodayLessons(timetableData, monitorClass)); setLoading(false); };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [monitorClass]);

  const mark = (slot, present) => {
    // Once marked, cannot change — lock it
    if (lockedSlots.has(slot)) return;
    setTeacherStatus(prev => ({ ...prev, [slot]: present }));
    setLockedSlots(prev => new Set([...prev, slot]));
  };
  const markedCount   = Object.keys(teacherStatus).length;
  const allMarked     = lessons.length > 0 && markedCount === lessons.length;
  const presentCount  = Object.values(teacherStatus).filter(v => v === true).length;
  const absentCount   = Object.values(teacherStatus).filter(v => v === false).length;
  const currentLesson = lessons.find(l => l.ongoing);

  const handleSubmit = async () => {
    if (!currentLesson) return;
    const slot = currentLesson.timeSlot;
    if (submittedSlots.has(slot)) return; // already submitted this slot
    setSubmitting(true); setMessage('');
    try {
      await api.submitLessonReport({
        report_date: todayISO,
        lessons: [{
          timeSlot:       slot,
          subject:        currentLesson.subject,
          teacher:        currentLesson.teacher,
          teacherPresent: teacherStatus[slot] ?? null,
        }],
      });
      setSubmittedSlots(prev => new Set([...prev, slot]));
      setSubmitted(true);
    } catch (err) {
      setMessage(err.message || 'Failed to submit.');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
      <div style={{ width:32, height:32, border:`3px solid #e2e8f0`, borderTopColor:NAVY, borderRadius:'50%', animation:'snSpin .7s linear infinite' }} />
    </div>
  );

  if (submitted && currentLesson && submittedSlots.has(currentLesson.timeSlot)) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', animation:'snFadeIn .3s ease' }}>
      <div style={{ width:72, height:72, borderRadius:'50%', background:'#d1fae5', color:'#10b981', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
        <CheckCircle2 size={36} />
      </div>
      <h2 style={{ fontSize:26, fontWeight:900, color:'#1e293b', marginBottom:6 }}>Report Submitted!</h2>
      <p style={{ color:'#94a3b8', marginBottom:6 }}>
        {currentLesson.subject} — {currentLesson.teacher} marked as{' '}
        <strong style={{ color: teacherStatus[currentLesson.timeSlot] ? '#10b981' : '#ef4444' }}>
          {teacherStatus[currentLesson.timeSlot] ? 'Present' : 'Absent'}
        </strong>
      </p>
      <p style={{ color:'#94a3b8', fontSize:13, marginBottom:24 }}>
        {submittedSlots.size} lesson{submittedSlots.size !== 1 ? 's' : ''} submitted today
      </p>
      <button className="sn-primary-btn" onClick={() => setSubmitted(false)}>Back to Schedule</button>
    </div>
  );

  return (
    <div style={{ animation:'snFadeIn .25s ease' }}>
      <div className="sn-page-header">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <ClipboardList size={13} color={NAVY} />
            <span style={{ fontSize:10, fontWeight:900, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.25em' }}>Representative Portal</span>
          </div>
          <h1 className="sn-page-title">Lesson Tracking</h1>
          <p className="sn-page-sub">{todayFull} — Class {monitorClass}</p>
        </div>
        <button
          onClick={() => setShowNotifSettings(true)}
          style={{ display:'flex', alignItems:'center', gap:7, background:'#fff', border:'1px solid #e8edf4', borderRadius:12, padding:'9px 16px', cursor:'pointer', fontWeight:700, fontSize:13, color:'#475569', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}
        >
          <Bell size={16} color="#2e5a88" /> Notifications
        </button>
      </div>

      {showNotifSettings && <NotificationSettings onClose={() => setShowNotifSettings(false)} />}

      <div className="sn-stats-grid">
        {[
          { label:'Total Lessons', value:lessons.length, active:true },
          { label:'Marked',        value:markedCount,    color:'#10b981' },
          { label:'Present',       value:presentCount,   color:'#10b981' },
          { label:'Absent',        value:absentCount,    color:'#ef4444' },
        ].map(({ label, value, active, color }) => (
          <div key={label} className={active ? 'sn-stat-card sn-stat-active' : 'sn-stat-card'}>
            <p className="sn-stat-val" style={{ color:active ? '#fff' : (color||'#1e293b') }}>{value}</p>
            <p className="sn-stat-lbl" style={{ color:active ? 'rgba(255,255,255,.6)' : (color ? color+'99' : '#94a3b8') }}>{label}</p>
          </div>
        ))}
      </div>

      {currentLesson && (
        <div className="sn-card sn-hero">
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:20 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div className="sn-ping-wrap"><div className="sn-ping-ring" /><div className="sn-ping-dot" /></div>
                <span style={{ fontSize:10, fontWeight:900, color:'#10b981', textTransform:'uppercase', letterSpacing:'0.2em' }}>Ongoing Now · {monitorClass}</span>
              </div>
              <p style={{ fontSize:32, fontWeight:900, color:'#1e293b', letterSpacing:'-.5px', margin:'6px 0 8px' }}>{currentLesson.subject}</p>
              <span className="sn-badge sn-badge-navy">{currentLesson.timeSlot}</span>
            </div>
            <div style={{ background:NAVY, color:'#fff', borderRadius:14, padding:'14px 22px', textAlign:'center', minWidth:150 }}>
              <p style={{ fontSize:10, fontWeight:900, opacity:.6, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Current Period</p>
              <p style={{ fontSize:22, fontWeight:900 }}>{currentLesson.timeSlot}</p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14, background:'#f8fafc', borderRadius:14, border:'1px solid #f1f5f9', padding:'14px 18px', marginBottom:18 }}>
            <div style={{ width:42, height:42, background:'#eff6ff', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <User size={22} color={NAVY} />
            </div>
            <div>
              <p style={{ fontSize:10, fontWeight:900, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.15em' }}>Instructor</p>
              <p style={{ fontSize:18, fontWeight:800, color:'#1e293b' }}>{currentLesson.teacher}</p>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { present:true,  icon:<CheckCircle size={17}/>, label:'Teacher Present', activeColor:'#10b981', activeShadow:'rgba(16,185,129,.28)', inactiveStyle:{ background:NAVY, color:'#fff', border:'none', boxShadow:`0 4px 14px rgba(46,90,136,.25)` } },
              { present:false, icon:<AlertCircle size={17}/>, label:'Teacher Absent',  activeColor:'#ef4444', activeShadow:'rgba(239,68,68,.25)',   inactiveStyle:{ background:'#fff', color:'#ef4444', border:'1px solid #fecaca', boxShadow:'none' } },
            ].map(({ present, icon, label, activeColor, activeShadow, inactiveStyle }) => {
              const isActive = teacherStatus[currentLesson.timeSlot] === present;
              const isLocked = lockedSlots.has(currentLesson.timeSlot);
              return (
                <button key={label}
                  onClick={() => mark(currentLesson.timeSlot, present)}
                  disabled={isLocked}
                  style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    padding:'15px', borderRadius:14, fontWeight:900, fontSize:13,
                    letterSpacing:'0.07em', textTransform:'uppercase',
                    fontFamily:"'DM Sans',sans-serif", transition:'all .15s',
                    cursor:        isLocked ? 'not-allowed' : 'pointer',
                    pointerEvents: isLocked ? 'none' : 'auto',
                    opacity:       isLocked && !isActive ? 0.35 : 1,
                    ...(isActive
                      ? { background:activeColor, color:'#fff', border:'none', boxShadow:`0 4px 14px ${activeShadow}` }
                      : inactiveStyle),
                  }}>
                  {icon} {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {lessons.length > 0 ? (
        <div className="sn-card" style={{ overflow:'hidden', marginBottom:22 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 22px', borderBottom:'1px solid #f1f5f9' }}>
            <p style={{ fontWeight:900, fontSize:17, color:'#1e293b' }}>Today's Schedule</p>
            <span className="sn-badge sn-badge-navy">{lessons.length} lessons · {dayName}</span>
          </div>
          {lessons.map((lesson) => {
            const status = teacherStatus[lesson.timeSlot];
            const isMarked = status !== undefined;
            return (
              <div key={lesson.timeSlot} className="sn-table-row" style={{ background:lesson.ongoing ? '#f0fdf4' : undefined }}>
                <div style={{ width:38, height:38, borderRadius:10, flexShrink:0, background:lesson.ongoing ? NAVY : '#f1f5f9', color:lesson.ongoing ? '#fff' : '#94a3b8', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Clock size={17} />
                </div>
                <div style={{ flex:1, minWidth:120 }}>
                  <p style={{ fontWeight:800, color:'#1e293b', fontSize:14 }}>{lesson.subject}</p>
                  <p style={{ fontSize:12, color:'#94a3b8', fontWeight:600 }}>{lesson.teacher} · {lesson.timeSlot}</p>
                </div>
                {lesson.ongoing && <span className="sn-badge sn-badge-green">Ongoing</span>}
                {lesson.ongoing ? (
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <div className="sn-toggle-group">
                      <button className="sn-toggle-btn" onClick={() => mark(lesson.timeSlot, true)}
                        disabled={lockedSlots.has(lesson.timeSlot)}
                        style={{
                          background:    status===true ? '#10b981':'transparent',
                          color:         status===true ? '#fff':'#94a3b8',
                          boxShadow:     status===true ? '0 2px 6px rgba(16,185,129,.25)':'none',
                          cursor:        lockedSlots.has(lesson.timeSlot) ? 'not-allowed' : 'pointer',
                          opacity:       lockedSlots.has(lesson.timeSlot) && status!==true ? 0.35 : 1,
                          pointerEvents: lockedSlots.has(lesson.timeSlot) ? 'none' : 'auto',
                        }}>
                        ✓ Present
                      </button>
                      <button className="sn-toggle-btn" onClick={() => mark(lesson.timeSlot, false)}
                        disabled={lockedSlots.has(lesson.timeSlot)}
                        style={{
                          background:    status===false ? '#ef4444':'transparent',
                          color:         status===false ? '#fff':'#94a3b8',
                          boxShadow:     status===false ? '0 2px 6px rgba(239,68,68,.2)':'none',
                          cursor:        lockedSlots.has(lesson.timeSlot) ? 'not-allowed' : 'pointer',
                          opacity:       lockedSlots.has(lesson.timeSlot) && status!==false ? 0.35 : 1,
                          pointerEvents: lockedSlots.has(lesson.timeSlot) ? 'none' : 'auto',
                        }}>
                        ✗ Absent
                      </button>
                    </div>
                    {submittedSlots.has(lesson.timeSlot) ? (
                      <span style={{ fontSize:12, fontWeight:700, color:'#10b981', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'6px 12px' }}>
                        ✓ Submitted
                      </span>
                    ) : (
                      <button className="sn-primary-btn" onClick={handleSubmit}
                        disabled={submitting || status === undefined}
                        style={{ padding:'8px 18px', fontSize:12, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                        {submitting ? <span className="sn-spinner" /> : <Send size={14} />}
                        {submitting ? 'Sending…' : 'Submit'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="sn-toggle-group">
                    <button className="sn-toggle-btn"
                      onClick={() => mark(lesson.timeSlot, true)}
                      disabled={lockedSlots.has(lesson.timeSlot)}
                      style={{
                        background:    status===true ? '#10b981':'transparent',
                        color:         status===true ? '#fff':'#94a3b8',
                        boxShadow:     status===true ? '0 2px 6px rgba(16,185,129,.25)':'none',
                        cursor:        lockedSlots.has(lesson.timeSlot) ? 'not-allowed' : 'pointer',
                        opacity:       lockedSlots.has(lesson.timeSlot) && status!==true ? 0.35 : 1,
                        pointerEvents: lockedSlots.has(lesson.timeSlot) ? 'none' : 'auto',
                      }}>
                      ✓ Present
                    </button>
                    <button className="sn-toggle-btn"
                      onClick={() => mark(lesson.timeSlot, false)}
                      disabled={lockedSlots.has(lesson.timeSlot)}
                      style={{
                        background:    status===false ? '#ef4444':'transparent',
                        color:         status===false ? '#fff':'#94a3b8',
                        boxShadow:     status===false ? '0 2px 6px rgba(239,68,68,.2)':'none',
                        cursor:        lockedSlots.has(lesson.timeSlot) ? 'not-allowed' : 'pointer',
                        opacity:       lockedSlots.has(lesson.timeSlot) && status!==false ? 0.35 : 1,
                        pointerEvents: lockedSlots.has(lesson.timeSlot) ? 'none' : 'auto',
                      }}>
                      ✗ Absent
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="sn-card" style={{ padding:'64px 32px', textAlign:'center', marginBottom:22 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'#f1f5f9', color:'#cbd5e1', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <Calendar size={36} />
          </div>
          <p style={{ fontWeight:900, fontSize:18, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em' }}>No Lessons Today</p>
          <p style={{ color:'#94a3b8', fontSize:14, marginTop:6 }}>No schedule found for {monitorClass} on {dayName}.</p>
        </div>
      )}

      {message && <p style={{ marginTop:12, fontSize:13, color:'#ef4444', fontWeight:700 }}>{message}</p>}
    </div>
  );
};

export default function LessonTracking({ monitorClass = 'Y3A', onBack, onLogout }) {
  const [page,        setPage]        = useState('lessons');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const PAGES = {
    lessons: <LessonTrackingPage monitorClass={monitorClass} />,
    history: <LessonHistoryPage  monitorClass={monitorClass} />,
  };

  const handleNavigate = (id) => {
    if (id === 'dashboard') { onBack?.(); return; }
    setPage(id);
    setSidebarOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes snFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes snSpin   { to{transform:rotate(360deg)} }
        @keyframes snPing   { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:0;transform:scale(2.2)} }
        .sn-sidebar { width:252px; min-height:100vh; background:#fff; border-right:1px solid #e8edf4; display:flex; flex-direction:column; position:fixed; left:0; top:0; bottom:0; z-index:200; box-shadow:2px 0 20px rgba(46,90,136,.07); transition:transform .25s ease; font-family:'DM Sans',sans-serif; }
        .sn-sidebar-logo { display:flex; align-items:center; gap:11px; padding:26px 20px 22px; border-bottom:1px solid #f1f5f9; }
        .sn-logo-icon { width:38px; height:38px; background:#fff; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; border:1px solid #e8edf4; }
        .sn-logo-icon img { width:100%; height:100%; object-fit:contain; }
        .sn-logo-text h1 { font-size:17px; font-weight:900; color:#1e293b; letter-spacing:-.3px; line-height:1; }
        .sn-logo-text p  { font-size:9px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#94a3b8; margin-top:3px; }
        .sn-mobile-close { display:none; margin-left:auto; background:none; border:none; color:#94a3b8; cursor:pointer; padding:4px; }
        .sn-sidebar-nav { flex:1; padding:18px 12px; display:flex; flex-direction:column; gap:3px; }
        .sn-nav-item { display:flex; align-items:center; gap:11px; padding:11px 13px; border-radius:12px; font-size:14px; font-weight:700; color:#64748b; cursor:pointer; transition:all .15s; border:none; background:transparent; width:100%; text-align:left; font-family:'DM Sans',sans-serif; }
        .sn-nav-item:hover { background:#f1f5f9; color:#1e293b; }
        .sn-nav-active { background:${NAVY} !important; color:#fff !important; }
        .sn-nav-item svg { opacity:.65; flex-shrink:0; }
        .sn-nav-active svg { opacity:1; }
        .sn-sidebar-footer { padding:12px; border-top:1px solid #f1f5f9; display:flex; flex-direction:column; gap:2px; }
        .sn-footer-btn { display:flex; align-items:center; gap:11px; padding:11px 13px; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; transition:all .15s; border:none; background:transparent; width:100%; text-align:left; font-family:'DM Sans',sans-serif; }
        .sn-footer-back { color:#64748b; } .sn-footer-back:hover { background:#f1f5f9; color:#1e293b; }
        .sn-footer-logout { color:#ef4444; } .sn-footer-logout:hover { background:#fff5f5; }
        .sn-main { margin-left:252px; min-height:100vh; background:${SLATE_BG}; font-family:'DM Sans',sans-serif; }
        .sn-main-inner { max-width:1040px; margin:0 auto; padding:32px 28px; }
        .sn-topbar { display:none; align-items:center; gap:14px; padding:14px 20px; background:#fff; border-bottom:1px solid #e8edf4; position:sticky; top:0; z-index:99; }
        .sn-hamburger { background:none; border:none; cursor:pointer; color:#475569; padding:4px; }
        .sn-mobile-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:150; }
        .sn-card { background:#fff; border-radius:16px; border:1px solid #e8edf4; box-shadow:0 2px 12px rgba(46,90,136,.05); margin-bottom:22px; }
        .sn-hero { padding:26px; }
        .sn-page-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; margin-bottom:24px; }
        .sn-page-title { font-size:26px; font-weight:900; color:#1e293b; letter-spacing:-.4px; }
        .sn-page-sub   { font-size:13px; color:#94a3b8; font-weight:600; margin-top:2px; }
        .sn-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:22px; }
        .sn-stat-card   { background:#fff; border-radius:14px; border:1px solid #e8edf4; padding:20px 22px; }
        .sn-stat-active { background:${NAVY}; border-color:${NAVY}; }
        .sn-stat-val    { font-size:30px; font-weight:900; }
        .sn-stat-lbl    { font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:.1em; margin-top:3px; }
        .sn-table-row   { display:flex; align-items:center; flex-wrap:wrap; gap:12px; padding:13px 22px; border-bottom:1px solid #f8fafc; transition:background .15s; }
        .sn-table-row:last-child { border-bottom:none; }
        .sn-table-row:hover { background:#fafbfc; }
        .sn-toggle-group { display:flex; background:#f1f5f9; border-radius:10px; padding:3px; gap:3px; }
        .sn-toggle-btn   { border:none; cursor:pointer; border-radius:8px; font-weight:900; font-size:11px; letter-spacing:.05em; padding:7px 14px; transition:all .15s; font-family:'DM Sans',sans-serif; }
        .sn-primary-btn  { display:inline-flex; align-items:center; gap:7px; background:${NAVY}; color:#fff; border:none; padding:10px 20px; border-radius:12px; font-weight:800; font-size:14px; cursor:pointer; transition:all .15s; box-shadow:0 3px 12px rgba(46,90,136,.22); font-family:'DM Sans',sans-serif; }
        .sn-primary-btn:hover:not(:disabled) { background:${NAVY_DK}; transform:translateY(-1px); }
        .sn-primary-btn:disabled { opacity:.55; cursor:not-allowed; transform:none; }
        .sn-badge       { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:800; }
        .sn-badge-green { background:#ecfdf5; color:#10b981; }
        .sn-badge-navy  { background:#eff6ff; color:${NAVY}; }
        .sn-ping-wrap   { position:relative; width:8px; height:8px; flex-shrink:0; }
        .sn-ping-ring   { position:absolute; inset:0; border-radius:50%; background:#10b981; animation:snPing 1.5s cubic-bezier(0,0,.2,1) infinite; }
        .sn-ping-dot    { position:relative; width:8px; height:8px; border-radius:50%; background:#10b981; }
        .sn-spinner     { width:16px; height:16px; border-radius:50%; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; animation:snSpin .7s linear infinite; display:inline-block; }
        @media(max-width:900px){ .sn-stats-grid { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:768px){
          .sn-sidebar { transform:translateX(-100%); }
          .sn-sidebar-open { transform:translateX(0); }
          .sn-topbar { display:flex; }
          .sn-mobile-close { display:block; }
          .sn-mobile-overlay { display:block; }
          .sn-main { margin-left:0; }
          .sn-main-inner { padding:20px 16px; }
        }
      `}</style>

      {sidebarOpen && <div className="sn-mobile-overlay" onClick={() => setSidebarOpen(false)} />}

      <Sidebar activePage={page} onNavigate={handleNavigate} onBack={onBack} onLogout={onLogout}
        mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      <div className="sn-main">
        <div className="sn-topbar">
          <button className="sn-hamburger" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div className="sn-logo-icon" style={{ width:30, height:30, borderRadius:8 }}>
              <img src={LogoImg} alt="logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
            </div>
            <span style={{ fontWeight:900, fontSize:16, color:'#1e293b', fontFamily:"'DM Sans',sans-serif" }}>StaffNet</span>
          </div>
        </div>
        <div className="sn-main-inner">{PAGES[page] || PAGES['lessons']}</div>
      </div>
    </>
  );
}
