
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('../config/db');
const { generateReport } = require('../controllers/reportController');

(async () => {
  try {
  
    const result = await pool.query(`
      SELECT asess.id AS session_id, asess.class_id, asess.session_date,
             c.name AS class_name, r.full_name AS rep_name
      FROM attendance_sessions asess
      JOIN classes c ON c.id = asess.class_id
      JOIN reps r ON r.id = asess.rep_id
      LEFT JOIN attendance_reports rep ON rep.session_id = asess.id
      WHERE rep.id IS NULL
    `);

    if (result.rows.length === 0) {
      console.log('All sessions already have reports.');
      process.exit(0);
    }

    console.log(`Generating reports for ${result.rows.length} session(s)...`);

    for (const row of result.rows) {
      try {
        const date = row.session_date.toISOString().split('T')[0];
        await generateReport({
          sessionId: row.session_id,
          classId: row.class_id,
          sessionDate: date,
          repName: row.rep_name,
          className: row.class_name,
        });
        console.log(`✓ Report generated for ${row.class_name} — ${date}`);
      } catch (err) {
        console.error(`✗ Failed for session ${row.session_id}:`, err.message);
      }
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
