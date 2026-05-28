const pool = require('../config/db');
const { getClassNamesFromJson } = require('../config/studentsData');

const syncClassesFromStudentsJson = async () => {
  const names = getClassNamesFromJson();
  for (const name of names) {
    await pool.query(
      'INSERT INTO classes (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      [name],
    );
  }
};

const getAllClasses = async (req, res) => {
  try {
    await syncClassesFromStudentsJson();
    const result = await pool.query('SELECT * FROM classes ORDER BY name');
    return res.json(result.rows);
  } catch (err) {
    console.error('Get classes error:', err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

const createClass = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Class name required.' });

  try {
    const result = await pool.query(
      'INSERT INTO classes (name) VALUES ($1) RETURNING *',
      [name]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Class already exists.' });
    }
    console.error('Create class error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAllClasses, createClass };
