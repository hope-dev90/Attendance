const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Ensure reports directory exists
const REPORTS_DIR = path.resolve(__dirname, '../../reports');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

/**
 * Generate CSV string from attendance records
 */
const generateCSV = ({ className, sessionDate, repName, records }) => {
  const header = 'Student Name,Student Number,Status';
  const rows = records.map(
    (r) => `"${r.full_name}","${r.student_number}","${r.status}"`
  );
  const summary = [
    '',
    `"Class","${className}"`,
    `"Date","${sessionDate}"`,
    `"Submitted By","${repName}"`,
    `"Total","${records.length}"`,
    `"Present","${records.filter((r) => r.status === 'present').length}"`,
    `"Late","${records.filter((r) => r.status === 'late').length}"`,
    `"Absent","${records.filter((r) => r.status === 'absent').length}"`,
  ];
  return [header, ...rows, ...summary].join('\n');
};

/**
 * Generate PDF file and return its path
 */
const generatePDF = ({ className, sessionDate, repName, records }) => {
  return new Promise((resolve, reject) => {
    const filename = `attendance_${className}_${sessionDate}_${Date.now()}.pdf`;
    const filepath = path.join(REPORTS_DIR, filename);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Header
    doc.fontSize(20).fillColor('#1e3a5f').text('Attendance Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#4a5568')
      .text(`Class: ${className}`, { align: 'center' })
      .text(`Date: ${sessionDate}`, { align: 'center' })
      .text(`Submitted by: ${repName}`, { align: 'center' });
    doc.moveDown(1);

    // Summary box
    const present = records.filter((r) => r.status === 'present').length;
    const late = records.filter((r) => r.status === 'late').length;
    const absent = records.filter((r) => r.status === 'absent').length;

    doc.fontSize(11).fillColor('#1a202c');
    doc.rect(40, doc.y, 515, 60).fill('#f0f4f8').stroke('#e2e8f0');
    const boxY = doc.y - 55;
    doc.fillColor('#276749').text(`Present: ${present}`, 60, boxY + 10);
    doc.fillColor('#b7791f').text(`Late: ${late}`, 200, boxY + 10);
    doc.fillColor('#c53030').text(`Absent: ${absent}`, 320, boxY + 10);
    doc.fillColor('#1a202c').text(`Total: ${records.length}`, 440, boxY + 10);
    doc.moveDown(3);

    // Table header
    doc.fontSize(10).fillColor('#ffffff');
    doc.rect(40, doc.y, 515, 22).fill('#1e3a5f');
    const tableHeaderY = doc.y - 18;
    doc.text('#', 50, tableHeaderY);
    doc.text('Student Name', 80, tableHeaderY);
    doc.text('Student Number', 300, tableHeaderY);
    doc.text('Status', 440, tableHeaderY);
    doc.moveDown(0.3);

    // Table rows
    records.forEach((r, i) => {
      const rowY = doc.y;
      const bg = i % 2 === 0 ? '#ffffff' : '#f7fafc';
      doc.rect(40, rowY, 515, 20).fill(bg);

      const statusColor =
        r.status === 'present' ? '#276749' :
        r.status === 'late'    ? '#b7791f' : '#c53030';

      doc.fillColor('#1a202c').fontSize(10);
      doc.text(String(i + 1), 50, rowY + 4);
      doc.text(r.full_name, 80, rowY + 4);
      doc.text(r.student_number, 300, rowY + 4);
      doc.fillColor(statusColor).text(r.status.toUpperCase(), 440, rowY + 4);
      doc.moveDown(0.15);
    });

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#718096')
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });

    doc.end();
    stream.on('finish', () => resolve({ filename, filepath }));
    stream.on('error', reject);
  });
};

module.exports = { generateCSV, generatePDF };
