require('dotenv').config({
  path: require('path').resolve(__dirname, '../../.env'),
});
const pool = require('./db');

const schema = `
  CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_number VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS reps (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    refresh_token TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMPTZ,
    profile_pic TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Add OTP columns if table already exists (safe re-run)
  ALTER TABLE reps ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
  ALTER TABLE reps ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6);
  ALTER TABLE reps ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
  ALTER TABLE reps ADD COLUMN IF NOT EXISTS profile_pic TEXT;

  CREATE TABLE IF NOT EXISTS attendance_sessions (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    rep_id INTEGER NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    is_delayed BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, session_date)
  );


  ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS is_delayed BOOLEAN DEFAULT FALSE;

  CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    note TEXT,
    UNIQUE(session_id, student_id)
  );

  -- Update constraint and add note column if table already exists
  ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS note TEXT;
  ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check;
  ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_status_check
    CHECK (status IN ('present', 'absent', 'late', 'excused'));

  CREATE TABLE IF NOT EXISTS attendance_reports (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    csv_data TEXT,
    pdf_path VARCHAR(500),
    total INTEGER DEFAULT 0,
    present_count INTEGER DEFAULT 0,
    late_count INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS lesson_reports (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    rep_id INTEGER NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    lessons JSONB NOT NULL,
    UNIQUE(class_id, report_date)
  );

  CREATE TABLE IF NOT EXISTS timetable (
    id SERIAL PRIMARY KEY,
    day VARCHAR(20) NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    class_name VARCHAR(10) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    teacher VARCHAR(100),
    UNIQUE(day, time_slot, class_name)
  );
`;

const classes = [
  'Y1A',
  'Y1B',
  'Y1C',
  'Y2A',
  'Y2B',
  'Y2C',
  'Y3A',
  'Y3B',
  'Y3C',
  'Y3D',
];

(async () => {
  try {
    await pool.query(schema);
    console.log('Tables created.');

    for (const name of classes) {
      await pool.query(
        'INSERT INTO classes (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [name],
      );
    }
    console.log('Classes seeded:', classes.join(', '));
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();
