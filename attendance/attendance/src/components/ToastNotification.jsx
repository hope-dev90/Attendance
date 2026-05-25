import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, Clock, AlertTriangle, BookOpen, CheckCircle, ChevronRight } from 'lucide-react';
import { saveNotification } from '../hooks/useNotificationDB';

/* ── Toast store (singleton — unchanged) ── */
let _addToast = null;
export const pushToast = (notif) => { if (_addToast) _addToast(notif); };

/* ── Type config — Slack-style dark surface ── */
const TYPE_CONFIG = {
  attendance: {
    accent:   '#4CAF82',
    iconBg:   '#1e3a2f',
    icon:     <Clock size={17} />,
    source:   'StaffNet · Attendance',
    duration: 6000,
  },
  delayed: {
    accent:   '#E8A838',
    iconBg:   '#3a2e1a',
    icon:     <AlertTriangle size={17} />,
    source:   'StaffNet · Warning',
    duration: 8000,
  },
  teacher: {
    accent:   '#5B9CF6',
    iconBg:   '#1a2a3f',
    icon:     <BookOpen size={17} />,
    source:   'StaffNet · Lesson',
    duration: 7000,
  },
  success: {
    accent:   '#4CAF82',
    iconBg:   '#1e3a2f',
    icon:     <CheckCircle size={17} />,
    source:   'StaffNet · Done',
    duration: 4000,
  },
  error: {
    accent:   '#E05353',
    iconBg:   '#3a1e1e',
    icon:     <Bell size={17} />,
    source:   'StaffNet · Error',
    duration: 6000,
  },
  default: {
    accent:   '#5B9CF6',
    iconBg:   '#1a2a3f',
    icon:     <Bell size={17} />,
    source:   'StaffNet',
    duration: 6000,
  },
};

/* ── Single toast card ── */
const Toast = ({ id, type = 'default', title, body, onDismiss, action }) => {
  const cfg        = TYPE_CONFIG[type] || TYPE_CONFIG.default;
  const [out, setOut] = useState(false);

  const dismiss = useCallback(() => {
    setOut(true);
    setTimeout(() => onDismiss(id), 300);
  }, [id, onDismiss]);

  useEffect(() => {
    const t = setTimeout(dismiss, cfg.duration);
    return () => clearTimeout(t);
  }, [dismiss, cfg.duration]);

  return (
    <div style={{
      position:     'relative',
      width:        360,
      background:   '#1a1d21',
      borderRadius: 10,
      borderLeft:   `3px solid ${cfg.accent}`,
      display:      'flex',
      alignItems:   'flex-start',
      gap:          12,
      padding:      '13px 14px 16px 14px',
      fontFamily:   "'DM Sans', system-ui, sans-serif",
      overflow:     'hidden',
      transform:    out ? 'translateX(110%)' : 'translateX(0)',
      opacity:      out ? 0 : 1,
      transition:   out
        ? 'transform .3s ease, opacity .3s ease'
        : 'transform .25s cubic-bezier(.16,1,.3,1), opacity .25s ease',
      animation:    out ? 'none' : 'snSlackIn .25s cubic-bezier(.16,1,.3,1)',
    }}>

      {/* Icon block */}
      <div style={{
        width:        36,
        height:       36,
        borderRadius: 8,
        background:   cfg.iconBg,
        color:        cfg.accent,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        flexShrink:   0,
        marginTop:    1,
      }}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Source line */}
        <p style={{
          fontSize:      10,
          fontWeight:    700,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          color:         '#616061',
          marginBottom:  3,
        }}>
          {cfg.source}
        </p>

        {/* Title */}
        <p style={{
          fontSize:     13,
          fontWeight:   700,
          color:        '#ffffff',
          lineHeight:   1.35,
          marginBottom: body ? 3 : 0,
        }}>
          {title}
        </p>

        {/* Message */}
        {body && (
          <p style={{
            fontSize:     12,
            color:        '#8d8d8d',
            lineHeight:   1.4,
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
          }}>
            {body}
          </p>
        )}

        {/* Action buttons */}
        {action && (
          <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
            <button
              onClick={() => { action.onClick(); dismiss(); }}
              style={{
                background:   '#2d6af0',
                color:        '#fff',
                border:       'none',
                borderRadius: 5,
                padding:      '5px 10px',
                fontSize:     11,
                fontWeight:   700,
                cursor:       'pointer',
                fontFamily:   'inherit',
              }}
            >
              {action.label}
            </button>
            <button
              onClick={dismiss}
              style={{
                background:   '#2e2f32',
                color:        '#8d8d8d',
                border:       'none',
                borderRadius: 5,
                padding:      '5px 10px',
                fontSize:     11,
                fontWeight:   700,
                cursor:       'pointer',
                fontFamily:   'inherit',
              }}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={dismiss}
        style={{
          background:  'none',
          border:      'none',
          cursor:      'pointer',
          color:       '#555',
          padding:     2,
          flexShrink:  0,
          marginTop:   -2,
          lineHeight:  1,
          transition:  'color .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
        onMouseLeave={e => e.currentTarget.style.color = '#555'}
      >
        <X size={14} />
      </button>

      {/* Progress bar track */}
      <div style={{
        position:     'absolute',
        bottom:       0,
        left:         0,
        right:        0,
        height:       2,
        background:   'rgba(255,255,255,0.08)',
      }}>
        <div style={{
          height:    '100%',
          background: cfg.accent,
          animation: `snSlackProgress ${cfg.duration}ms linear forwards`,
        }} />
      </div>
    </div>
  );
};

/* ── Toast container (mount once in App — unchanged) ── */
export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const addToast = useCallback((notif) => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev.slice(-4), { ...notif, id }]);
    saveNotification({ tag: notif.type || 'default', title: notif.title, body: notif.body });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    _addToast = addToast;
    return () => { _addToast = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes snSlackIn {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes snSlackProgress {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
      <div style={{
        position:       'fixed',
        bottom:         24,
        right:          24,
        zIndex:         9999,
        display:        'flex',
        flexDirection:  'column',
        gap:            8,
        alignItems:     'flex-end',
        pointerEvents:  'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <Toast {...t} onDismiss={removeToast} />
          </div>
        ))}
      </div>
    </>
  );
}
