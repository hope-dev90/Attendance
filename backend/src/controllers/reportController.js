const pool = require('../config/db');
const { generateCSV, generatePDF } = require('../utils/reportGenerator');
const path = require('path');
const fs = require('fs');


const generateReport = async ({ sessionId, classId, sessionDate, repName, className }) => {

  const result = await pool.query(
    `SELECT s.full_name, s.student_number, ar.status
     FROM attendance_records ar
     JOIN students s ON s.id = ar.student_id
     WHERE ar.session_id = $1
     ORDER BY s.full_name`,
    [sessionId]
  );
  const records = result.rows;

  const counts = {
    total: records.length,
    present: records.filter((r) => r.status === 'present').length,
    late: records.filter((r) => r.status === 'late').length,
    absent: records.filter((r) => r.status === 'absent').length,
  };

  // Generate CSV
  const csvData = generateCSV({ className, sessionDate, repName, records });

  // Generate PDF
  const { filename } = await generatePDF({ className, sessionDate, repName, records });

  
  await pool.query(
    `INSERT INTO attendance_reports
       (session_id, class_id, session_date, csv_data, pdf_path, total, present_count, late_count, absent_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT DO NOTHING`,
    [sessionId, classId, sessionDate, csvData, filename,
     counts.total, counts.present, counts.late, counts.absent]
  );

  return { csvData, pdfFilename: filename, counts };
};


const getReports = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.session_date, r.generated_at, r.total,
              r.present_count, r.late_count, r.absent_count,
              r.pdf_path, c.name AS class_name
       FROM attendance_reports r
       JOIN classes c ON c.id = r.class_id
       ORDER BY r.generated_at DESC
       LIMIT 50`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Get reports error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/reports/:id/csv — download CSV
const downloadCSV = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.csv_data, r.session_date, c.name AS class_name
       FROM attendance_reports r
       JOIN classes c ON c.id = r.class_id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Report not found.' });

    const { csv_data, session_date, class_name } = result.rows[0];
    const filename = `attendance_${class_name}_${session_date}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csv_data);
  } catch (err) {
    console.error('Download CSV error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/reports/:id/pdf — download PDF
const downloadPDF = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.pdf_path, r.session_date, c.name AS class_name
       FROM attendance_reports r
       JOIN classes c ON c.id = r.class_id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Report not found.' });

    const { pdf_path, session_date, class_name } = result.rows[0];
    const filepath = path.resolve(__dirname, '../../reports', pdf_path);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'PDF file not found.' });
    }

    const filename = `attendance_${class_name}_${session_date}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(filepath);
  } catch (err) {
    console.error('Download PDF error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { generateReport, getReports, downloadCSV, downloadPDF };
