const pool = require('../config/db');

const getTimetable = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM timetable ORDER BY day, time_slot, class_name');
    res.json(result.rows);
  } catch (err) {
    console.error('Get timetable error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getTimetableByClass = async (req, res) => {
  try {
    const { className } = req.params;
    const result = await pool.query(
      'SELECT * FROM timetable WHERE class_name = $1 ORDER BY day, time_slot',
      [className]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get timetable by class error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getTimetable, getTimetableByClass };
