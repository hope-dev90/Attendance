/**
 * Seed dummy students for testing
 *   node src/config/seed.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');

// 20 dummy students spread across Y1A, Y1B, Y2A
const students = [
  { student_number: 'STU001', full_name: 'Chubby Mensah',      class: 'Y1A' },
  { student_number: 'STU002', full_name: 'Kofi Asante',        class: 'Y1A' },
  { student_number: 'STU003', full_name: 'Ama Boateng',        class: 'Y1A' },
  { student_number: 'STU004', full_name: 'Kwame Darko',        class: 'Y1A' },
  { student_number: 'STU005', full_name: 'Abena Owusu',        class: 'Y1A' },
  { student_number: 'STU006', full_name: 'Yaw Frimpong',       class: 'Y1A' },
  { student_number: 'STU007', full_name: 'Akosua Tetteh',      class: 'Y1A' },
  { student_number: 'STU008', full_name: 'Fiifi Agyeman',      class: 'Y1A' },
  { student_number: 'STU009', full_name: 'Efua Quansah',       class: 'Y1A' },
  { student_number: 'STU010', full_name: 'Nana Adjei',         class: 'Y1A' },
  { student_number: 'STU011', full_name: 'Kwesi Amponsah',     class: 'Y1B' },
  { student_number: 'STU012', full_name: 'Adwoa Nyarko',       class: 'Y1B' },
  { student_number: 'STU013', full_name: 'Kojo Antwi',         class: 'Y1B' },
  { student_number: 'STU014', full_name: 'Maame Serwaa',       class: 'Y1B' },
  { student_number: 'STU015', full_name: 'Bright Osei',        class: 'Y1B' },
  { student_number: 'STU016', full_name: 'Akua Bonsu',         class: 'Y2A' },
  { student_number: 'STU017', full_name: 'Kwabena Poku',       class: 'Y2A' },
  { student_number: 'STU018', full_name: 'Esi Amoah',          class: 'Y2A' },
  { student_number: 'STU019', full_name: 'Yaa Asantewaa',      class: 'Y2A' },
  { student_number: 'STU020', full_name: 'Nii Armah',          class: 'Y2A' },
];

(async () => {
  try {
    // Get class id map
    const classRes = await pool.query('SELECT id, name FROM classes');
    const classMap = {};
    classRes.rows.forEach((c) => { classMap[c.name] = c.id; });

    let inserted = 0;
    for (const s of students) {
      const classId = classMap[s.class];
      if (!classId) {
        console.warn(`Class ${s.class} not found, skipping ${s.full_name}`);
        continue;
      }
      await pool.query(
        `INSERT INTO students (student_number, full_name, class_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (student_number) DO UPDATE
           SET full_name = EXCLUDED.full_name,
               class_id  = EXCLUDED.class_id`,
        [s.student_number, s.full_name, classId]
      );
      inserted++;
    }

    console.log(`Seeded ${inserted} students.`);
    console.log('Classes populated: Y1A (10 students), Y1B (5 students), Y2A (5 students)');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
})();
