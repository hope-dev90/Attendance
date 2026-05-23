/**
 * Seeds all students from attendance/attendance/src/data/students.json into the DB.
 * Run: node src/config/seedStudents.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');
const path = require('path');
const students = require(path.resolve(__dirname, '../../../attendance/attendance/src/data/students.json'));

(async () => {
  try {
    // Get class map
    const classRes = await pool.query('SELECT id, name FROM classes');
    const classMap = {};
    classRes.rows.forEach((c) => { classMap[c.name] = c.id; });

    // Wipe old students cleanly
    await pool.query('DELETE FROM attendance_records');
    await pool.query('DELETE FROM attendance_sessions');
    await pool.query('DELETE FROM attendance_reports');
    await pool.query('DELETE FROM students');

    let inserted = 0;
    let skipped = 0;

    for (const s of students) {
      const classId = classMap[s.class];
      if (!classId) {
        console.warn(`  ⚠ Class "${s.class}" not found — skipping ${s.name}`);
        skipped++;
        continue;
      }

      // Use original JSON id as student_number for traceability
      const studentNumber = `${s.class}-${String(s.id).padStart(3, '0')}`;

      await pool.query(
        `INSERT INTO students (student_number, full_name, class_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (student_number) DO UPDATE
           SET full_name = EXCLUDED.full_name,
               class_id  = EXCLUDED.class_id`,
        [studentNumber, s.name, classId]
      );
      inserted++;
    }

    console.log(`✓ Seeded ${inserted} students.`);
    if (skipped > 0) console.log(`  ${skipped} skipped (class not found).`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
})();
