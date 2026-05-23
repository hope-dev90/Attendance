const pool = require('../config/db');

// Get all students in the rep's class
const getStudentsByClass = async (req, res) => {
  const classId = req.params.classId || req.rep.classId || req.rep.class_id;

  if (!classId || classId === 'undefined') {
    return res.status(400).json({ message: 'No class assigned to this account. Please contact admin.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, student_number, full_name, email
       FROM students
       WHERE class_id = $1
       ORDER BY full_name`,
      [classId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Get students error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// Bulk add students to a class (from existing list)
const addStudents = async (req, res) => {
  const { students } = req.body;
  // students: [{ student_number, full_name, email, class_id }]

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ message: 'Students array required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const inserted = [];
    for (const s of students) {
      const { student_number, full_name, email, class_id } = s;
      if (!student_number || !full_name || !class_id) continue;

      const result = await client.query(
        `INSERT INTO students (student_number, full_name, email, class_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (student_number) DO UPDATE
           SET full_name = EXCLUDED.full_name,
               email = EXCLUDED.email,
               class_id = EXCLUDED.class_id
         RETURNING *`,
        [student_number, full_name, email || null, class_id]
      );
      inserted.push(result.rows[0]);
    }

    await client.query('COMMIT');
    return res.status(201).json({ inserted: inserted.length, students: inserted });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Add students error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

module.exports = { getStudentsByClass, addStudents };
