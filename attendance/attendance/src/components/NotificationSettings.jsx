import { useState } from 'react';
import { Bell, X, Check } from 'lucide-react';

const DEFAULTS = {
  enabled:          true,
  attendanceReminder: true,  // remind before 8:00 AM window
  delayedWarning:   true,    // warn before 8:30 AM delayed cutoff
  teacherReminder:  true,    // remind when ongoing lesson has no teacher marked
};

const STORAGE_KEY = 'sn_notif_settings';

export const getSettings = () => {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return DEFAULTS; }
};

const saveSettings = (s) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

/* ── Request permission + fire a desktop notification ── */
export const notify = async (title, body, tag) => {
  const settings = getSettings();
  if (!settings.enabled) return;

  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  if (Notification.permission !== 'granted') return;

  new Notification(title, {
    body,
    tag,
    icon: '/src/assets/log.png',
    badge: '/src/assets/log.png',
    requireInteraction: false,
  });
};

/* ── Toggle row ── */
const Toggle = ({ label, description, checked, onChange, disabled }) => (
  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, padding:'14px 0', borderBottom:'1px solid #f1f5f9' }}>
    <div style={{ flex:1 }}>
      <p style={{ fontSize:14, fontWeight:700, color: disabled ? '#94a3b8' : '#1e293b' }}>{label}</p>
      <p style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>{description}</p>
    </div>
    <button
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width:44, height:24, borderRadius:12, border:'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked && !disabled ? '#2e5a88' : '#e2e8f0',
        position:'relative', transition:'background .2s', flexShrink:0, marginTop:2,
      }}
    >
      <span style={{
        position:'absolute', top:2, left: checked && !disabled ? 22 : 2,
        width:20, height:20, borderRadius:'50%', background:'#fff',
        boxShadow:'0 1px 4px rgba(0,0,0,.2)', transition:'left .2s',
      }} />
    </button>
  </div>
);

/* ── Main panel ── */
export default function NotificationSettings({ onClose }) {
  const [settings, setSettings] = useState(getSettings);
  const [permission, setPermission] = useState(Notification.permission);

  const update = (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    saveSettings(next);
  };

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') update('enabled', true);
  };

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:999,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }}>
      <div style={{
        background:'#fff', borderRadius:20, width:'100%', maxWidth:440,
        boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden',
        fontFamily:"'DM Sans',sans-serif",
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Bell size={20} color="#2e5a88" />
            <p style={{ fontWeight:900, fontSize:17, color:'#1e293b' }}>Notification Settings</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding:'8px 24px 24px' }}>
          {/* Permission banner */}
          {permission !== 'granted' && (
            <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:12, padding:'12px 16px', margin:'16px 0', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:'#92400e' }}>Desktop notifications blocked</p>
                <p style={{ fontSize:12, color:'#b45309', marginTop:2 }}>
                  {permission === 'denied' ? 'Blocked in browser settings — enable manually.' : 'Allow notifications to receive reminders.'}
                </p>
              </div>
              {permission !== 'denied' && (
                <button onClick={requestPermission} style={{ background:'#2e5a88', color:'#fff', border:'none', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                  Allow
                </button>
              )}
            </div>
          )}

          {permission === 'granted' && (
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'10px 14px', margin:'16px 0', display:'flex', alignItems:'center', gap:8 }}>
              <Check size={15} color="#16a34a" />
              <p style={{ fontSize:12, fontWeight:700, color:'#15803d' }}>Desktop notifications are enabled</p>
            </div>
          )}

          {/* Master toggle */}
          <Toggle
            label="All Notifications"
            description="Master switch — turn off to silence everything"
            checked={settings.enabled}
            onChange={(v) => update('enabled', v)}
            disabled={permission !== 'granted'}
          />

          {/* Individual toggles */}
          <Toggle
            label="Attendance Window Reminder"
            description="Reminds you at 7:55 AM to mark attendance before the window opens"
            checked={settings.attendanceReminder}
            onChange={(v) => update('attendanceReminder', v)}
            disabled={!settings.enabled || permission !== 'granted'}
          />
          <Toggle
            label="Delayed Warning"
            description="Warns you at 8:25 AM — 5 minutes before submission becomes delayed"
            checked={settings.delayedWarning}
            onChange={(v) => update('delayedWarning', v)}
            disabled={!settings.enabled || permission !== 'granted'}
          />
          <Toggle
            label="Teacher Marking Reminder"
            description="Reminds you when a lesson is ongoing and the teacher hasn't been marked yet"
            checked={settings.teacherReminder}
            onChange={(v) => update('teacherReminder', v)}
            disabled={!settings.enabled || permission !== 'granted'}
          />
        </div>
      </div>
    </div>
  );
}
