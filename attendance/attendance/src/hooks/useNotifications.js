import { useEffect, useRef } from 'react';
import { notify, getSettings } from '../components/NotificationSettings';

/**
 * Fires scheduled notifications based on current time.
 * Call this once in LessonTracking with the current lesson state.
 *
 * @param {object[]} lessons        - today's lessons array
 * @param {object}   teacherStatus  - { [timeSlot]: true|false|undefined }
 * @param {boolean}  attendanceSubmitted - whether attendance was already submitted today
 */
export default function useNotifications(lessons, teacherStatus, attendanceSubmitted) {
  const firedRef = useRef(new Set()); // track which notifications already fired this session

  useEffect(() => {
    const tick = () => {
      const settings = getSettings();
      if (!settings.enabled) return;

      const now   = new Date();
      const h     = now.getHours();
      const m     = now.getMinutes();
      const total = h * 60 + m;

      // 7:55 AM — attendance window reminder
      if (settings.attendanceReminder && !attendanceSubmitted) {
        if (total === 7 * 60 + 55 && !firedRef.current.has('att-reminder')) {
          firedRef.current.add('att-reminder');
          notify(
            '⏰ Mark Attendance Soon',
            'The attendance window opens in 5 minutes (8:00 AM). Get ready!',
            'att-reminder'
          );
        }
      }

      // 8:25 AM — delayed warning
      if (settings.delayedWarning && !attendanceSubmitted) {
        if (total === 8 * 60 + 25 && !firedRef.current.has('delayed-warning')) {
          firedRef.current.add('delayed-warning');
          notify(
            '⚠️ Attendance Deadline in 5 Minutes',
            'Submit attendance before 8:30 AM or it will be marked as delayed.',
            'delayed-warning'
          );
        }
      }

      // Teacher reminder — fires when a lesson becomes ongoing and teacher not marked
      if (settings.teacherReminder && lessons.length > 0) {
        const ongoing = lessons.find(l => l.ongoing);
        if (ongoing) {
          const tag = `teacher-${ongoing.timeSlot}`;
          const isMarked = teacherStatus[ongoing.timeSlot] !== undefined;
          if (!isMarked && !firedRef.current.has(tag)) {
            firedRef.current.add(tag);
            notify(
              '📋 Mark Teacher Presence',
              `${ongoing.subject} is now ongoing. Has ${ongoing.teacher} arrived?`,
              tag
            );
          }
        }
      }
    };

    // Check every minute
    tick(); // run immediately on mount
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [lessons, teacherStatus, attendanceSubmitted]);
}
