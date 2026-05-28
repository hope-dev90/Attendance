const pool = require('../config/db');
const { generateReport } = require('./reportController');
const { deliverStudentAttendance } = require('../utils/staffnetDelivery');

// Attendance window: 8:00 AM – 8:30 AM (on time), after 8:30 = delayed
const WINDOW_START_HOUR = 8;   // 08:00
const WINDOW_START_MIN  = 0;
const WINDOW_END_HOUR   = 8;   // 08:30
const WINDOW_END_MIN    = 30;

const getSubmissionStatus = () => {
  // TIME WINDOW TEMPORARILY DISABLED FOR STAFFNET INTEGRATION TESTING
  // Re-enable by restoring the time checks below
  return { allowed: true, delayed: false };

  /* Original time window logic (re-enable when done testing):
  const now = new Date();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  const windowStart = 8 * 60;
  const windowEnd   = 8 * 60 + 30;
  if (totalMinutes < windowStart) {
    return { allowed: false, delayed: false, reason: `Attendance window opens at 8:00 AM. Current time: ${now.toLocaleTimeString()}.` };
  }
  if (totalMinutes <= windowEnd) {
    return { allowed: true, delayed: false };
  }
  return { allowed: true, delayed: true, reason: `Submitted after 8:30 AM (${now.toLocaleTimeString()}). This will be marked as a delayed submission.` };
  */
};

// Submit attendance for a session
const submitAttendance = async (req, res) => {
  const { session_date, records } = req.body;
  const repId   = req.rep.id;
  const classId = req.rep.classId || req.rep.class_id;

  if (!classId) {
    return res.status(400).json({ message: 'No class assigned to your account.' });
  }

  if (!session_date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'session_date and records are required.' });
  }

  // Only allow submitting for today
  const today = new Date().toISOString().split('T')[0];
  if (session_date !== today) {
    return res.status(400).json({ message: 'Attendance can only be submitted for today.' });
  }

  // Check time window
  const timeStatus = getSubmissionStatus();
  if (!timeStatus.allowed) {
    return res.status(403).json({ message: timeStatus.reason, code: 'WINDOW_NOT_OPEN' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if already submitted today (once per day enforcement)
    const existing = await client.query(
      'SELECT id, submitted_at FROM attendance_sessions WHERE class_id = $1 AND session_date = $2',
      [classId, session_date]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      const submittedAt = new Date(existing.rows[0].submitted_at).toLocaleTimeString();
      return res.status(409).json({
        message: `Attendance for today has already been submitted at ${submittedAt}.`,
        code: 'ALREADY_SUBMITTED',
      });
    }

    // Create session
    const sessionResult = await client.query(
      `INSERT INTO attendance_sessions (class_id, rep_id, session_date, is_delayed)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [classId, repId, session_date, timeStatus.delayed]
    );
    const session = sessionResult.rows[0];

    // Insert attendance records
    for (const record of records) {
      const { student_id, status, note } = record;
      if (!student_id || !['present', 'absent', 'late', 'excused'].includes(status)) continue;
      await client.query(
        `INSERT INTO attendance_records (session_id, student_id, status, note)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (session_id, student_id) DO UPDATE
           SET status = EXCLUDED.status, note = EXCLUDED.note`,
        [session.id, student_id, status, note || null]
      );
    }

    await client.query('COMMIT');

    // Fetch absent students for notification
    const absentResult = await client.query(
      `SELECT s.full_name, s.student_number, ar.status, ar.note
       FROM attendance_records ar
       JOIN students s ON s.id = ar.student_id
       WHERE ar.session_id = $1 AND ar.status IN ('absent', 'excused')`,
      [session.id]
    );

    // Fetch class name and rep name
    const metaResult = await client.query(
      `SELECT c.name AS class_name, r.full_name AS rep_name
       FROM classes c, reps r
       WHERE c.id = $1 AND r.id = $2`,
      [classId, repId]
    );
    const meta = metaResult.rows[0];

    // Emit socket event for StaffNet (real-time)
    const io = req.app.get('io');
    if (io) {
      io.emit('attendance:submitted', {
        classId,
        className: meta?.class_name,
        sessionDate: session_date,
        absentees: absentResult.rows,
      });
    }

    // Generate CSV + PDF report and store for patron dashboard
    let report = null;
    try {
      report = await generateReport({
        sessionId: session.id,
        classId,
        sessionDate: session_date,
        repName: meta?.rep_name,
        className: meta?.class_name,
      });

      // Emit report ready event to StaffNet
      if (io) {
        io.emit('report:ready', {
          classId,
          className: meta?.class_name,
          sessionDate: session_date,
          counts: report.counts,
        });
      }
    } catch (reportErr) {
      console.error('Report generation error:', reportErr.message);
    }

    // Deliver to StaffNet (fire-and-forget)
    deliverStudentAttendance({
      studentClass: meta?.class_name,
      date:         session_date,
      submittedBy:  `Monitor of ${meta?.class_name}`,
      records:      records, // contains student_id, status, note from request body
    });

    return res.status(201).json({
      message: timeStatus.delayed
        ? 'Attendance submitted (delayed — after 9:00 AM).'
        : 'Attendance submitted.',
      session_id: session.id,
      is_delayed: timeStatus.delayed,
      delayed_reason: timeStatus.delayed ? timeStatus.reason : null,
      report: report ? { counts: report.counts } : null,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Submit attendance error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

// Get attendance for a class on a specific date
const getAttendanceByClassAndDate = async (req, res) => {
  const { classId, date } = req.params;

  try {
    const result = await pool.query(
      `SELECT s.id AS student_id, s.full_name, s.student_number, ar.status, ar.note,
              asess.session_date, asess.submitted_at
       FROM attendance_sessions asess
       JOIN attendance_records ar ON ar.session_id = asess.id
       JOIN students s ON s.id = ar.student_id
       WHERE asess.class_id = $1 AND asess.session_date = $2
       ORDER BY s.full_name`,
      [classId, date]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Get attendance error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// Get all absentees (for StaffNet)
const getAbsentees = async (req, res) => {
  const { date, classId } = req.query;

  try {
    let query = `
      SELECT s.full_name, s.student_number, ar.status,
             c.name AS class_name, asess.session_date
      FROM attendance_records ar
      JOIN attendance_sessions asess ON asess.id = ar.session_id
      JOIN students s ON s.id = ar.student_id
      JOIN classes c ON c.id = asess.class_id
      WHERE ar.status IN ('absent', 'late')
    `;
    const params = [];

    if (date) {
      params.push(date);
      query += ` AND asess.session_date = $${params.length}`;
    }
    if (classId) {
      params.push(classId);
      query += ` AND asess.class_id = $${params.length}`;
    }

    query += ' ORDER BY asess.session_date DESC, s.full_name';

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    console.error('Get absentees error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// Get attendance history for the rep's class
const getAttendanceHistory = async (req, res) => {
  const classId = req.rep.classId || req.rep.class_id;

  if (!classId) {
    return res.status(400).json({ message: 'No class assigned to your account.' });
  }

  try {
    const result = await pool.query(
      `SELECT asess.id AS session_id, asess.session_date, asess.submitted_at,
              asess.class_id, asess.is_delayed,
              COUNT(ar.id) AS total,
              SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) AS present_count,
              SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) AS late_count,
              SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
              rep.id AS report_id
       FROM attendance_sessions asess
       LEFT JOIN attendance_records ar ON ar.session_id = asess.id
       LEFT JOIN attendance_reports rep ON rep.session_id = asess.id
       WHERE asess.class_id = $1
       GROUP BY asess.id, rep.id
       ORDER BY asess.session_date DESC`,
      [classId]
    );

    // Attach per-student records to each session
    const sessions = result.rows;
    for (const session of sessions) {
      const records = await pool.query(
        `SELECT ar.student_id, s.full_name AS student_name, ar.status, ar.note
         FROM attendance_records ar
         JOIN students s ON s.id = ar.student_id
         WHERE ar.session_id = $1
         ORDER BY s.full_name`,
        [session.session_id]
      );
      session.records = records.rows;
    }

    return res.json(sessions);
  } catch (err) {
    console.error('Get history error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// --- Email helper ---
const sendPatronNotification = async ({ className, repName, sessionDate, absentees }) => {
  const absentList = absentees
    .filter((s) => s.status === 'absent')
    .map((s) => `<li>${s.full_name} (${s.student_number})</li>`)
    .join('');

  const lateList = absentees
    .filter((s) => s.status === 'late')
    .map((s) => `<li>${s.full_name} (${s.student_number})</li>`)
    .join('');

  const html = `
    <h2>Attendance Report — ${className}</h2>
    <p><strong>Date:</strong> ${sessionDate}</p>
    <p><strong>Submitted by:</strong> ${repName}</p>

    ${absentList ? `<h3>Absent Students</h3><ul>${absentList}</ul>` : ''}
    ${lateList ? `<h3>Late Students</h3><ul>${lateList}</ul>` : ''}

    <p style="color:#888;font-size:12px;">This is an automated message from the Class Rep System.</p>
  `;

  await transporter.sendMail({
    from: `Class Rep System <${process.env.EMAIL_USER}>`,
    to: process.env.PATRON_EMAIL,
    subject: `[Attendance] ${className} — ${sessionDate}`,
    html,
  });
};

module.exports = {
  submitAttendance,
  getAttendanceByClassAndDate,
  getAbsentees,
  getAttendanceHistory,
};
