const pool = require('../config/db');
const path = require('path');
const fs   = require('fs');
const PDFDocument = require('pdfkit');

const REPORTS_DIR = path.resolve(__dirname, '../../reports');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

// POST /api/lesson-reports — submit end-of-day lesson report
const submitLessonReport = async (req, res) => {
  const { report_date, lessons } = req.body;
  // lessons: [{ timeSlot, subject, teacher, teacherPresent: true|false }]
  const repId   = req.rep.id;
  const classId = req.rep.classId || req.rep.class_id;

  if (!report_date || !Array.isArray(lessons) || lessons.length === 0) {
    return res.status(400).json({ message: 'report_date and lessons are required.' });
  }

  try {
    // Fetch meta
    const metaResult = await pool.query(
      `SELECT c.name AS class_name, r.full_name AS rep_name
       FROM classes c, reps r WHERE c.id = $1 AND r.id = $2`,
      [classId, repId]
    );
    const meta = metaResult.rows[0];

    // Save to DB
    await pool.query(
      `INSERT INTO lesson_reports (class_id, rep_id, report_date, lessons)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (class_id, report_date) DO UPDATE SET lessons = EXCLUDED.lessons, submitted_at = NOW()`,
      [classId, repId, report_date, JSON.stringify(lessons)]
    );

    // Generate PDF
    const pdfFilename = await generateLessonPDF({ meta, report_date, lessons });

    // Generate CSV
    const csvData = generateLessonCSV({ meta, report_date, lessons });

    // Emit to StaffNet
    const io = req.app.get('io');
    if (io) {
      io.emit('lesson_report:submitted', {
        classId,
        className: meta?.class_name,
        reportDate: report_date,
        lessons,
      });
    }

    return res.status(201).json({
      message: 'Lesson report submitted.',
      pdf: pdfFilename,
    });
  } catch (err) {
    console.error('Lesson report error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/lesson-reports — get reports for rep's class
const getLessonReports = async (req, res) => {
  const classId = req.rep.classId || req.rep.class_id;
  try {
    const result = await pool.query(
      `SELECT id, report_date, submitted_at, lessons
       FROM lesson_reports WHERE class_id = $1
       ORDER BY report_date DESC LIMIT 30`,
      [classId]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

const generateLessonCSV = ({ meta, report_date, lessons }) => {
  const header = 'Time Slot,Subject,Teacher,Status';
  const rows = lessons.map(
    (l) => `"${l.timeSlot}","${l.subject}","${l.teacher}","${l.teacherPresent ? 'Present' : 'Absent'}"`
  );
  const summary = [
    '',
    `"Class","${meta?.class_name}"`,
    `"Date","${report_date}"`,
    `"Submitted By","${meta?.rep_name}"`,
    `"Present","${lessons.filter(l => l.teacherPresent).length}"`,
    `"Absent","${lessons.filter(l => !l.teacherPresent).length}"`,
  ];
  return [header, ...rows, ...summary].join('\n');
};

const generateLessonPDF = ({ meta, report_date, lessons }) => {
  return new Promise((resolve, reject) => {
    const filename = `lesson_report_${meta?.class_name}_${report_date}_${Date.now()}.pdf`;
    const filepath = path.join(REPORTS_DIR, filename);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    doc.fontSize(20).fillColor('#1e3a5f').text('Lesson Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#4a5568')
      .text(`Class: ${meta?.class_name}`, { align: 'center' })
      .text(`Date: ${report_date}`, { align: 'center' })
      .text(`Submitted by: ${meta?.rep_name}`, { align: 'center' });
    doc.moveDown(1);

    const present = lessons.filter(l => l.teacherPresent).length;
    const absent  = lessons.filter(l => !l.teacherPresent).length;

    doc.fontSize(11).fillColor('#1a202c');
    doc.rect(40, doc.y, 515, 50).fill('#f0f4f8').stroke('#e2e8f0');
    const boxY = doc.y - 45;
    doc.fillColor('#276749').text(`Teachers Present: ${present}`, 60, boxY + 12);
    doc.fillColor('#c53030').text(`Teachers Absent: ${absent}`, 300, boxY + 12);
    doc.moveDown(2.5);

    // Table header
    doc.fontSize(10).fillColor('#ffffff');
    doc.rect(40, doc.y, 515, 22).fill('#1e3a5f');
    const thY = doc.y - 18;
    doc.text('Time Slot', 50, thY);
    doc.text('Subject', 160, thY);
    doc.text('Teacher', 310, thY);
    doc.text('Status', 450, thY);
    doc.moveDown(0.3);

    lessons.forEach((l, i) => {
      const rowY = doc.y;
      doc.rect(40, rowY, 515, 20).fill(i % 2 === 0 ? '#ffffff' : '#f7fafc');
      const statusColor = l.teacherPresent ? '#276749' : '#c53030';
      doc.fillColor('#1a202c').fontSize(10);
      doc.text(l.timeSlot, 50, rowY + 4);
      doc.text(l.subject,  160, rowY + 4);
      doc.text(l.teacher,  310, rowY + 4);
      doc.fillColor(statusColor).text(l.teacherPresent ? 'PRESENT' : 'ABSENT', 450, rowY + 4);
      doc.moveDown(0.15);
    });

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#718096').text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.end();
    stream.on('finish', () => resolve(filename));
    stream.on('error', reject);
  });
};

module.exports = { submitLessonReport, getLessonReports };
