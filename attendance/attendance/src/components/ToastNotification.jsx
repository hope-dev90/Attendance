import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, Clock, AlertTriangle, BookOpen, CheckCircle, ChevronRight } from 'lucide-react';
import { saveNotification } from '../hooks/useNotificationDB';

/* ── Toast store (singleton outside React) ── */
let _addToast = null;
export const pushToast = (notif) => { if (_addToast) _addToast(notif); };

const TYPE_CONFIG = {
  attendance: {
    icon:    <Clock size={18} />,
    accent:  '#2e5a88',
    bg:      '#eff6ff',
    border:  '#bfdbfe',
    label:   'Attendance',
  },
  delayed: {
    icon:    <AlertTriangle size={18} />,
    accent:  '#d97706',
    bg:      '#fffbeb',
    border:  '#fde68a',
    label:   'Warning',
  },
  teacher: {
    icon:    <BookOpen size={18} />,
    accent:  '#7c3aed',
    bg:      '#f5f3ff',
    border:  '#ddd6fe',
    label:   'Lesson',
  },
  success: {
    icon:    <CheckCircle size={18} />,
    accent:  '#059669',
    bg:      '#ecfdf5',
    border:  '#a7f3d0',
    label:   'Done',
  },
  default: {
    icon:    <Bell size={18} />,
    accent:  '#2e5a88',
    bg:      '#f8fafc',
    border:  '#e2e8f0',
    label:   'Notice',
  },
};

/* ── Single toast card ── */
const Toast = ({ id, type = 'default', title, body, onDismiss, action }) => {
  const cfg        = TYPE_CONFIG[type] || TYPE_CONFIG.default;
  const [out, setOut] = useState(false);

  const dismiss = useCallback(() => {
    setOut(true);
    setTimeout(() => onDismiss(id), 320);
  }, [id, onDismiss]);

  // Auto-dismiss after 6 s
  useEffect(() => {
    const t = setTimeout(dismiss, 6000);
    return () => clearTimeout(t);
  }, [dismiss]);

  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderLeft: `4px solid ${cfg.accent}`,
      borderRadius: 14,
      padding: '14px 14px 14px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,.10)',
      fontFamily: "'DM Sans', sans-serif",
      width: 340,
      transform: out ? 'translateX(110%)' : 'translateX(0)',
      opacity: out ? 0 : 1,
      transition: 'transform .32s cubic-bezier(.4,0,.2,1), opacity .32s ease',
      animation: 'snToastIn .35s cubic-bezier(.4,0,.2,1)',
      position: 'relative',
    }}>
      {/* Icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 10, background: cfg.accent,
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
      }}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: cfg.accent }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', lineHeight: 1.3, marginBottom: body ? 4 : 0 }}>
          {title}
        </p>
        {body && (
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{body}</p>
        )}
        {action && (
          <button
            onClick={() => { action.onClick(); dismiss(); }}
            style={{
              marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 800, color: cfg.accent, background: 'none',
              border: 'none', cursor: 'pointer', padding: 0, textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {action.label} <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#94a3b8', padding: 2, flexShrink: 0, marginTop: -2,
        }}
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        borderRadius: '0 0 14px 14px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', background: cfg.accent, opacity: 0.35,
          animation: 'snToastProgress 6s linear forwards',
        }} />
      </div>
    </div>
  );
};

/* ── Toast container (mount once in App) ── */
export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const addToast = useCallback((notif) => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev.slice(-4), { ...notif, id }]); // max 5 visible
    // Save to IDB
    saveNotification({ tag: notif.type || 'default', title: notif.title, body: notif.body });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Register global push function
  useEffect(() => { _addToast = addToast; return () => { _addToast = null; }; }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes snToastIn {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes snToastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10,
        alignItems: 'flex-end',
      }}>
        {toasts.map(t => (
          <Toast key={t.id} {...t} onDismiss={removeToast} />
        ))}
      </div>
    </>
  );
}
