/**
 * Delivers attendance data to StaffNet's external API.
 * Fires silently — never blocks or fails the main submit.
 */

const STAFFNET_BASE = process.env.STAFFNET_URL || 'http://10.12.72.100:5001';
const TERM_ID       = parseInt(process.env.STAFFNET_TERM_ID || '3');

const post = async (path, body) => {
  try {
    const res = await fetch(`${STAFFNET_BASE}${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(5000), // 5s — fail fast, never block main flow
    });
    if (!res.ok) {
      console.warn(`StaffNet delivery failed [${res.status}]:`, path);
    } else {
      console.log(`StaffNet delivery OK:`, path);
    }
  } catch (err) {
    console.warn(`StaffNet delivery error (${path}):`, err.message);
  }
};

/**
 * Send teacher attendance to StaffNet.
 * Exact field names required by StaffNet:
 *   teacherName, subject, date, status, submittedBy, termId
 */
const deliverTeacherAttendance = ({ teacherName, subject, date, teacherPresent, submittedBy }) => {
  return post('/api/external/teacher-attendance', {
    teacherName,
    subject,
    date,
    status:      teacherPresent ? 'present' : 'absent',
    submittedBy,
    termId:      TERM_ID,
  });
};

/**
 * Send student attendance to StaffNet.
 * Exact field names required by StaffNet:
 *   studentClass, date, submittedBy, termId, records[{ studentId, status, note? }]
 */
const deliverStudentAttendance = ({ studentClass, date, submittedBy, records }) => {
  return post('/api/external/student-attendance', {
    studentClass,
    date,
    submittedBy,
    termId:  TERM_ID,
    records: records.map(r => ({
      studentId: r.student_id,
      status:    r.status,
      ...(r.note ? { note: r.note } : {}),
    })),
  });
};

module.exports = { deliverTeacherAttendance, deliverStudentAttendance };
