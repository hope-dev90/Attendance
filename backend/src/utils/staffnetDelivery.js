/**
 * Delivers attendance data to StaffNet's external API.
 * Fires silently: never blocks or fails the main submit.
 */

const STAFFNET_BASE = (process.env.STAFFNET_URL || 'http://10.12.72.100:5001').replace(/\/+$/, '');
const STAFFNET_ENABLED = process.env.STAFFNET_ENABLED !== 'false';
const STAFFNET_TIMEOUT_MS = parseInt(process.env.STAFFNET_TIMEOUT_MS || '5000', 10);
const STAFFNET_RETRIES = parseInt(process.env.STAFFNET_RETRIES || '1', 10);
const TERM_ID = process.env.STAFFNET_TERM_ID ? parseInt(process.env.STAFFNET_TERM_ID, 10) : null;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (err, res) => {
  if (err) return true;
  return res && res.status >= 500;
};

const post = async (path, body) => {
  if (!STAFFNET_ENABLED) {
    console.log(`StaffNet delivery skipped (${path}): STAFFNET_ENABLED=false`);
    return;
  }

  const url = `${STAFFNET_BASE}${path}`;
  const payload = JSON.stringify(body);
  const attempts = Math.max(1, STAFFNET_RETRIES + 1);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const startedAt = Date.now();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        signal: AbortSignal.timeout(STAFFNET_TIMEOUT_MS),
      });

      const durationMs = Date.now() - startedAt;
      if (res.ok) {
        console.log(`StaffNet delivery OK (${durationMs}ms):`, url);
        return;
      }

      console.warn(`StaffNet delivery failed [${res.status}] (${durationMs}ms):`, url);
      if (attempt < attempts && shouldRetry(null, res)) {
        await wait(750 * attempt);
        continue;
      }
      return;
    } catch (err) {
      const durationMs = Date.now() - startedAt;
      console.warn(
        `StaffNet delivery error (${url}) attempt ${attempt}/${attempts} (${durationMs}ms):`,
        err.message
      );

      if (attempt < attempts && shouldRetry(err)) {
        await wait(750 * attempt);
        continue;
      }
      return;
    }
  }
};

/**
 * Send teacher attendance to StaffNet.
 * Exact field names required by StaffNet:
 *   teacherName, subject, date, status, submittedBy
 */
const deliverTeacherAttendance = ({ teacherName, subject, date, teacherPresent, submittedBy }) => {
  const body = {
    teacherName,
    subject,
    date,
    status: teacherPresent ? 'present' : 'absent',
    submittedBy,
  };

  if (TERM_ID) body.termId = TERM_ID;
  return post('/api/external/teacher-attendance', body);
};

/**
 * Send student attendance to StaffNet.
 * Exact field names required by StaffNet:
 *   studentClass, date, submittedBy, records[{ studentId, status, note? }]
 */
const deliverStudentAttendance = ({ studentClass, date, submittedBy, records }) => {
  const body = {
    studentClass,
    date,
    submittedBy,
    records: records.map((r) => ({
      studentId: r.student_id,
      status: r.status,
      ...(r.note ? { note: r.note } : {}),
    })),
  };

  if (TERM_ID) body.termId = TERM_ID;
  return post('/api/external/student-attendance', body);
};

module.exports = { deliverTeacherAttendance, deliverStudentAttendance };
