# StaffNet Attendance — API Reference

Base URL: `http://localhost:5000/api`

All protected routes require:
```
Authorization: Bearer <accessToken>
```

---

## StaffNet External Submission APIs

These are the receiving endpoints on StaffNet for the class-monitor developer.

Base URL: `http://10.12.72.100:5001`

No `termId` is required. StaffNet automatically links submissions to the active term.

### POST `/api/external/teacher-attendance`
Submit teacher lesson attendance.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "teacherName": "Mike Galen",
  "subject": "Networking",
  "date": "2026-05-27",
  "status": "present",
  "submittedBy": "Y1A Class Monitor"
}
```

Valid `status` values: `"present"` | `"absent"`

**Success:** `201 Created`

### POST `/api/external/student-attendance`
Submit student attendance for a class.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "studentClass": "Y1A",
  "date": "2026-05-27",
  "submittedBy": "Y1A Class Monitor",
  "records": [
    { "studentId": 101, "status": "present" },
    { "studentId": 102, "status": "absent", "note": "Sick" },
    { "studentId": 103, "status": "late" }
  ]
}
```

Valid `status` values: `"present"` | `"absent"` | `"late"` | `"excused"`

**Success:** `201 Created`

---

## Authentication `/api/auth`

### POST `/api/auth/signup`
Register a new class representative.

**Body:**
```json
{
  "full_name": "Hope Mutimutuje",
  "email": "rep@school.edu",
  "password": "password123",
  "class_id": 2
}
```
**Response `201`:**
```json
{
  "message": "Account created. Check your email for the verification code.",
  "email": "rep@school.edu"
}
```

---

### POST `/api/auth/verify-otp`
Verify email with OTP code sent after signup.

**Body:**
```json
{ "email": "rep@school.edu", "otp": "482910" }
```
**Response `200`:**
```json
{
  "message": "Email verified successfully.",
  "accessToken": "...",
  "refreshToken": "...",
  "rep": { "id": 1, "full_name": "...", "email": "...", "class_id": 2 }
}
```

---

### POST `/api/auth/resend-otp`
Resend OTP to email.

**Body:**
```json
{ "email": "rep@school.edu" }
```
**Response `200`:** `{ "message": "New OTP sent." }`

---

### POST `/api/auth/login`
Login with email and password.

**Body:**
```json
{ "email": "rep@school.edu", "password": "password123" }
```
**Response `200`:**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "rep": { "id": 1, "full_name": "...", "email": "...", "class_id": 2 }
}
```
**Error `403`** — unverified account:
```json
{ "message": "Please verify your email before logging in.", "email": "rep@school.edu" }
```

---

### POST `/api/auth/refresh`
Get a new access token using refresh token.

**Body:**
```json
{ "refreshToken": "..." }
```
**Response `200`:** `{ "accessToken": "...", "refreshToken": "..." }`

---

### POST `/api/auth/logout` 🔒
Logout and invalidate refresh token.

**Response `200`:** `{ "message": "Logged out." }`

---

### GET `/api/auth/me` 🔒
Get current logged-in rep profile.

**Response `200`:**
```json
{
  "id": 1,
  "full_name": "Hope Mutimutuje",
  "email": "rep@school.edu",
  "class_id": 2,
  "class_name": "Y1B"
}
```

---

## Classes `/api/classes`

### GET `/api/classes`
Get all available classes (public — used for signup dropdown).

**Response `200`:**
```json
[
  { "id": 1, "name": "Y1A" },
  { "id": 2, "name": "Y1B" },
  ...
]
```

---

### POST `/api/classes`
Create a new class.

**Body:** `{ "name": "Y4A" }`
**Response `201`:** `{ "id": 11, "name": "Y4A" }`

---

## Students `/api/students`

### GET `/api/students/my-class` 🔒
Get all students in the logged-in rep's class.

**Response `200`:**
```json
[
  { "id": 43, "student_number": "Y1B-017", "full_name": "MUTIMUTUJE Hope", "email": null },
  ...
]
```

---

### GET `/api/students/class/:classId` 🔒
Get students for a specific class by ID.

**Response `200`:** Same shape as above.

---

### POST `/api/students/bulk` 🔒
Bulk insert or update students.

**Body:**
```json
{
  "students": [
    { "student_number": "Y1B-001", "full_name": "Alice Uwimana", "class_id": 2 },
    { "student_number": "Y1B-002", "full_name": "Bob Nkurunziza", "class_id": 2 }
  ]
}
```
**Response `201`:** `{ "inserted": 2, "students": [...] }`

---

## Attendance `/api/attendance`

### POST `/api/attendance` 🔒
Submit attendance for today's session.

**Rules:**
- Only allowed between **8:00 AM – end of day**
- Before 8:30 AM = on time; after 8:30 AM = marked **DELAYED**
- Only one submission per class per day

**Body:**
```json
{
  "session_date": "2026-05-27",
  "records": [
    { "student_id": 43, "status": "present", "note": null },
    { "student_id": 44, "status": "absent",  "note": "Sick" },
    { "student_id": 45, "status": "late",    "note": null }
  ]
}
```
Status values: `"present"` | `"absent"` | `"late"` | `"excused"`

**Response `201`:**
```json
{
  "message": "Attendance submitted.",
  "session_id": 12,
  "is_delayed": false,
  "delayed_reason": null,
  "report": { "counts": { "total": 28, "present": 25, "late": 1, "absent": 2 } }
}
```
**Error `403`** — window not open:
```json
{ "message": "Attendance window opens at 8:00 AM. Current time: 7:30:00 AM.", "code": "WINDOW_NOT_OPEN" }
```
**Error `409`** — already submitted:
```json
{ "message": "Attendance for today has already been submitted at 08:15:00 AM.", "code": "ALREADY_SUBMITTED" }
```

---

### GET `/api/attendance/history` 🔒
Get attendance history for the rep's class with per-student records.

**Response `200`:**
```json
[
  {
    "session_id": 12,
    "session_date": "2026-05-27",
    "submitted_at": "2026-05-27T08:15:00Z",
    "class_id": 2,
    "is_delayed": false,
    "total": "28",
    "present_count": "25",
    "late_count": "1",
    "absent_count": "2",
    "report_id": 5,
    "records": [
      { "student_id": 43, "student_name": "MUTIMUTUJE Hope", "status": "present", "note": null },
      { "student_id": 44, "student_name": "Alice Uwimana",   "status": "absent",  "note": "Sick" }
    ]
  }
]
```

---

### GET `/api/attendance/absentees` 🔒
Get absent/late students. Supports filters.

**Query params:** `?date=2026-05-27&classId=2`

**Response `200`:**
```json
[
  { "full_name": "Alice Uwimana", "student_number": "Y1B-001", "status": "absent", "class_name": "Y1B", "session_date": "2026-05-27" }
]
```

---

### GET `/api/attendance/:classId/:date` 🔒
Get full attendance for a specific class and date.

**Example:** `GET /api/attendance/2/2026-05-27`

**Response `200`:**
```json
[
  { "student_id": 43, "full_name": "MUTIMUTUJE Hope", "student_number": "Y1B-017", "status": "present", "note": null, "session_date": "2026-05-27" }
]
```

---

## Reports `/api/reports`

### GET `/api/reports` 🔒
List all generated attendance reports (patron dashboard).

**Response `200`:**
```json
[
  { "id": 5, "session_date": "2026-05-27", "generated_at": "...", "total": 28, "present_count": 25, "late_count": 1, "absent_count": 2, "pdf_path": "attendance_Y1B_2026-05-27_xxx.pdf", "class_name": "Y1B" }
]
```

---

### GET `/api/reports/:id/csv` 🔒
Download attendance report as CSV file.

**Response:** `text/csv` file download.

---

### GET `/api/reports/:id/pdf` 🔒
Download attendance report as PDF file.

**Response:** `application/pdf` file download.

---

## Lesson Reports `/api/lesson-reports`

### POST `/api/lesson-reports` 🔒
Submit end-of-lesson teacher presence report.

**Body:**
```json
{
  "report_date": "2026-05-27",
  "lessons": [
    { "timeSlot": "08:30-09:20", "subject": "JavaScript", "teacher": "Stanley", "teacherPresent": true },
    { "timeSlot": "09:20-10:10", "subject": "JavaScript", "teacher": "Stanley", "teacherPresent": false }
  ]
}
```
**Response `201`:**
```json
{ "message": "Lesson report submitted.", "pdf": "lesson_report_Y1B_2026-05-27_xxx.pdf" }
```

---

### GET `/api/lesson-reports` 🔒
Get all lesson reports for the rep's class.

**Response `200`:**
```json
[
  {
    "id": 3,
    "report_date": "2026-05-27",
    "submitted_at": "2026-05-27T16:00:00Z",
    "lessons": [
      { "timeSlot": "08:30-09:20", "subject": "JavaScript", "teacher": "Stanley", "teacherPresent": true }
    ]
  }
]
```

---

## Socket.io Events

The server emits these real-time events (connect to `http://localhost:5000`):

| Event | Payload | Trigger |
|-------|---------|---------|
| `attendance:submitted` | `{ classId, className, sessionDate, absentees }` | When rep submits attendance |
| `report:ready` | `{ classId, className, sessionDate, counts }` | When PDF/CSV report is generated |
| `lesson_report:submitted` | `{ classId, className, reportDate, lessons }` | When lesson report is submitted |

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `WINDOW_NOT_OPEN` | 403 | Attendance submitted before 8:00 AM |
| `ALREADY_SUBMITTED` | 409 | Attendance already submitted today |
| `MODULE_NOT_FOUND` | 401 | Invalid or missing token |

---

## Setup Commands

```bash
# Install dependencies
cd backend && npm install

# Create DB tables + seed classes
node src/config/migrate.js

# Seed all 281 students from JSON
node src/config/seedStudents.js

# Regenerate missing PDF reports
node src/scripts/regenerateReports.js

# Start server
npm run dev
```
