/**
 * Seeds timetable from attendance/attendance/src/data/timetable.json into the DB.
 * Run: node src/config/seedTimetable.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./db');
const path = require('path');
const timetableData = require(path.resolve(__dirname, '../../../attendance/attendance/src/data/timetable.json'));

(async () => {
  try {
    // Wipe old timetable
    await pool.query('DELETE FROM timetable');

    let inserted = 0;

    for (const dayData of timetableData) {
      const day = dayData.day;
      const schedule = dayData.schedule;

      for (const [timeSlot, classData] of Object.entries(schedule)) {
        if (!classData) continue;

        for (const [className, lesson] of Object.entries(classData)) {
          if (!lesson) continue;

          await pool.query(
            `INSERT INTO timetable (day, time_slot, class_name, subject, teacher)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (day, time_slot, class_name) DO UPDATE
               SET subject = EXCLUDED.subject,
                   teacher = EXCLUDED.teacher`,
            [day, timeSlot, className, lesson.subject, lesson.teacher]
          );
          inserted++;
        }
      }
    }

    console.log(`✓ Seeded ${inserted} timetable entries.`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
})();
