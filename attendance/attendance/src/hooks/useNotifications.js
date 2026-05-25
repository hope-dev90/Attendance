import { useEffect, useRef } from 'react';
import { getSettings } from '../components/NotificationSettings';
import { pushToast } from '../components/ToastNotification';

/**
 * Fires both in-app toasts AND desktop notifications.
 */
const fireNotif = async (type, title, body, tag) => {
  // In-app toast (always)
  pushToast({ type, title, body });

  // Desktop notification (if permitted)
  const settings = getSettings();
  if (!settings.enabled) return;
  if (Notification.permission === 'default') await Notification.requestPermission();
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, tag, icon: '/favicon.svg', requireInteraction: false });
};

export default function useNotifications(lessons, teacherStatus, attendanceSubmitted) {
  const firedRef = useRef(new Set());

  useEffect(() => {
    const tick = () => {
      const settings = getSettings();
      if (!settings.enabled) return;

      const now   = new Date();
      const total = now.getHours() * 60 + now.getMinutes();

      // 7:55 AM — attendance window reminder (fires between 7:55 and 7:59)
      if (settings.attendanceReminder && !attendanceSubmitted) {
        if (total >= 7 * 60 + 55 && total < 8 * 60 && !firedRef.current.has('att-reminder')) {
          firedRef.current.add('att-reminder');
          fireNotif('attendance', '⏰ Mark Attendance Soon',
            'The attendance window opens in 5 minutes (8:00 AM). Get ready!', 'att-reminder');
        }
      }

      // 8:25 AM — delayed warning (fires between 8:25 and 8:29)
      if (settings.delayedWarning && !attendanceSubmitted) {
        if (total >= 8 * 60 + 25 && total < 8 * 60 + 30 && !firedRef.current.has('delayed-warning')) {
          firedRef.current.add('delayed-warning');
          fireNotif('delayed', '⚠️ Deadline in 5 Minutes',
            'Submit attendance before 8:30 AM or it will be marked as delayed.', 'delayed-warning');
        }
      }

    
      if (settings.teacherReminder && lessons.length > 0) {
        const ongoing = lessons.find(l => l.ongoing);
        if (ongoing) {
          const tag     = `teacher-${ongoing.timeSlot}`;
          const isMarked = teacherStatus[ongoing.timeSlot] !== undefined;
          if (!isMarked && !firedRef.current.has(tag)) {
            firedRef.current.add(tag);
            fireNotif('teacher', '📋 Mark Teacher Presence',
              `${ongoing.subject} is now ongoing. Has ${ongoing.teacher} arrived?`, tag);
          }
        }
      }
    };

    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [lessons, teacherStatus, attendanceSubmitted]);
}
